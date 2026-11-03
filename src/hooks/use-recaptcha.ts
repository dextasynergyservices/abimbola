"use client";

import { useCallback, useRef } from "react";

/**
 * Google reCAPTCHA v3 (invisible) for public forms.
 *
 * The script is loaded lazily — call `preload()` when the user first
 * interacts with a form (e.g. onFocus) so pages that never use a form
 * don't pay for the ~150KB script.
 *
 * If NEXT_PUBLIC_RECAPTCHA_SITE_KEY is unset, `execute()` resolves to null
 * and the server skips verification (see lib/engagement/recaptcha.ts).
 */

declare global {
	interface Window {
		grecaptcha?: {
			ready: (cb: () => void) => void;
			execute: (siteKey: string, opts: { action: string }) => Promise<string>;
		};
	}
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
let scriptPromise: Promise<void> | null = null;
let lastError: string | null = null;

/** Why the last execute() produced no token (sent to the server for diagnostics). */
export function getRecaptchaError(): string | null {
	return lastError;
}

function loadScript(): Promise<void> {
	if (!SITE_KEY || typeof window === "undefined") return Promise.resolve();
	if (window.grecaptcha) return Promise.resolve();
	if (scriptPromise) return scriptPromise;

	scriptPromise = new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => {
			scriptPromise = null;
			reject(new Error("Failed to load reCAPTCHA"));
		};
		document.head.appendChild(script);
	});
	return scriptPromise;
}

export function useRecaptcha() {
	const preloaded = useRef(false);

	const preload = useCallback(() => {
		if (preloaded.current) return;
		preloaded.current = true;
		loadScript().catch(() => {
			preloaded.current = false;
		});
	}, []);

	const execute = useCallback(
		async (action: string): Promise<string | null> => {
			if (!SITE_KEY) return null;
			lastError = null;
			try {
				await loadScript();
				const grecaptcha = window.grecaptcha;
				if (!grecaptcha) {
					lastError = "script loaded but grecaptcha missing";
					return null;
				}
				// Never hang the form if Google is blocked or slow.
				return await Promise.race([
					new Promise<string>((resolve, reject) => {
						grecaptcha.ready(() => {
							grecaptcha.execute(SITE_KEY, { action }).then(resolve, reject);
						});
					}),
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error("timed out")), 8000),
					),
				]);
			} catch (error) {
				lastError =
					(error instanceof Error ? error.message : String(error)) ||
					"execute failed";
				console.error("reCAPTCHA execute failed:", error);
				return null;
			}
		},
		[],
	);

	return { preload, execute, enabled: Boolean(SITE_KEY) };
}
