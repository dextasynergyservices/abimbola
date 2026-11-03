/**
 * First-party, cookieless analytics tracker (client-side).
 *
 * Designed to keep the database asleep:
 *   • Pageviews, active time and events are queued in memory.
 *   • The queue is sent ONCE, as a single beacon, when the visitor hides the
 *     tab, switches app, or leaves — i.e. roughly one request per visit.
 *   • Very long visits also flush every 40 queued items.
 *
 * Nothing is recorded on /admin, for bots/automation, or when the author has
 * excluded their browser.
 */

type Props = Record<string, string | number | boolean>;

interface Item {
	t: "pageview" | "event" | "engagement";
	p: string;
	at: number;
	r?: string;
	n?: string;
	d?: number;
	props?: Props;
}

const ENDPOINT = "/api/collect";
const SESSION_IDLE_MS = 30 * 60_000;
const MAX_PAGE_SECONDS = 30 * 60; // ignore idle tabs beyond 30 min/page
const FLUSH_AT = 40;

export const DISABLED_KEY = "analytics.disabled";
export const TRACK_ME_KEY = "analytics.track-me";

let queue: Item[] = [];
let current: {
	path: string;
	item: Item;
	acc: number;
	since: number | null;
	reported: number;
} | null = null;
let listenersAttached = false;
let firstPageviewSent = false;

function isBrowser() {
	return typeof window !== "undefined";
}

export function isSelfExcluded(): boolean {
	try {
		return localStorage.getItem(DISABLED_KEY) === "1";
	} catch {
		return false;
	}
}

export function setSelfExcluded(excluded: boolean): void {
	try {
		if (excluded) {
			localStorage.setItem(DISABLED_KEY, "1");
			localStorage.removeItem(TRACK_ME_KEY);
		} else {
			localStorage.removeItem(DISABLED_KEY);
			localStorage.setItem(TRACK_ME_KEY, "1");
		}
	} catch {}
}

/** Called when the admin area mounts: exclude the author's own visits by default. */
export function autoExcludeAdminBrowser(): void {
	try {
		if (localStorage.getItem(TRACK_ME_KEY) !== "1") {
			localStorage.setItem(DISABLED_KEY, "1");
		}
	} catch {}
}

function enabled(): boolean {
	if (!isBrowser()) return false;
	if (location.pathname.startsWith("/admin")) return false;
	if ((navigator as Navigator & { webdriver?: boolean }).webdriver)
		return false;
	return !isSelfExcluded();
}

function sessionId(): string {
	try {
		const now = Date.now();
		const last = Number(sessionStorage.getItem("a_sid_t") || 0);
		let sid = sessionStorage.getItem("a_sid");
		if (!sid || now - last > SESSION_IDLE_MS) {
			sid =
				typeof crypto !== "undefined" && "randomUUID" in crypto
					? crypto.randomUUID()
					: `${now.toString(36)}${Math.random().toString(36).slice(2, 12)}`;
			sessionStorage.setItem("a_sid", sid);
		}
		sessionStorage.setItem("a_sid_t", String(now));
		return sid;
	} catch {
		return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
	}
}

function activeSeconds(): number {
	if (!current) return 0;
	const ms = current.acc + (current.since ? Date.now() - current.since : 0);
	return Math.min(MAX_PAGE_SECONDS, Math.round(ms / 1000));
}

/** Record active time for the current page into the queue. */
function settle() {
	if (!current) return;
	const total = activeSeconds();
	const delta = total - current.reported;
	if (delta <= 0) return;
	if (queue.includes(current.item)) {
		current.item.d = total;
	} else {
		queue.push({ t: "engagement", p: current.path, d: delta, at: Date.now() });
	}
	current.reported = total;
}

function flush() {
	if (queue.length === 0) return;
	const batch = queue;
	queue = [];
	const body = JSON.stringify({
		sid: sessionId(),
		now: Date.now(),
		items: batch,
	});
	try {
		const sent =
			typeof navigator.sendBeacon === "function" &&
			navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
		if (!sent) {
			fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(
				() => {},
			);
		}
	} catch {}
}

function onHide() {
	if (current?.since) {
		current.acc += Date.now() - current.since;
		current.since = null;
	}
	settle();
	flush();
}

function attachListeners() {
	if (listenersAttached) return;
	listenersAttached = true;
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") onHide();
		else if (current && !current.since) current.since = Date.now();
	});
	window.addEventListener("pagehide", onHide);

	// Declarative click tracking: <a data-track="buy-click" data-track-book="…">
	document.addEventListener(
		"click",
		(e) => {
			const el = (e.target as Element | null)?.closest?.(
				"[data-track]",
			) as HTMLElement | null;
			if (!el) return;
			const props: Props = {};
			for (const [k, v] of Object.entries(el.dataset)) {
				if (k.startsWith("track") && k !== "track" && v) {
					props[k.slice(5, 6).toLowerCase() + k.slice(6)] = v;
				}
			}
			trackEvent(el.dataset.track as string, props);
			// Outbound links usually open a new tab; send now so it isn't lost.
			flush();
		},
		{ capture: true },
	);
}

function externalReferrer(): string | undefined {
	try {
		const utm = new URLSearchParams(location.search).get("utm_source");
		if (utm) return utm;
		if (!document.referrer) return undefined;
		const ref = new URL(document.referrer);
		return ref.host === location.host ? undefined : document.referrer;
	} catch {
		return undefined;
	}
}

/** Call on every route change (see AnalyticsTracker). */
export function trackPageview(path: string): void {
	if (!enabled()) return;
	attachListeners();
	if (current?.path === path) return;
	settle();
	const item: Item = { t: "pageview", p: path, at: Date.now(), d: 0 };
	if (!firstPageviewSent) {
		item.r = externalReferrer();
		firstPageviewSent = true;
	}
	queue.push(item);
	current = {
		path,
		item,
		acc: 0,
		since: document.visibilityState === "visible" ? Date.now() : null,
		reported: 0,
	};
	if (queue.length >= FLUSH_AT) flush();
}

/** Custom event, e.g. trackEvent("newsletter-signup"). Safe to call anywhere. */
export function trackEvent(name: string, props?: Props): void {
	if (!enabled()) return;
	attachListeners();
	queue.push({
		t: "event",
		n: name.slice(0, 80),
		p: location.pathname,
		at: Date.now(),
		...(props && Object.keys(props).length ? { props } : {}),
	});
	if (queue.length >= FLUSH_AT) flush();
}
