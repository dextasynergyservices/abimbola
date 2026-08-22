export interface PublicSettings {
	contactEmail?: string | null;
	contactPhone?: string | null;
	address?: string | null;
	instagramUrl?: string | null;
	facebookUrl?: string | null;
	whatsappUrl?: string | null;
	telegramUrl?: string | null;
	discordUrl?: string | null;
	tiktokUrl?: string | null;
	youtubeUrl?: string | null;
}

let cachedSettings: PublicSettings | null = null;
let pendingFetch: Promise<PublicSettings> | null = null;

/**
 * Fetch public settings with in-memory singleton caching on the client side.
 * Prevents multiple components (e.g. Footer + CommunityModal) or route changes
 * from firing repetitive HTTP requests.
 */
export async function getClientPublicSettings(): Promise<PublicSettings> {
	if (cachedSettings) {
		return cachedSettings;
	}

	if (pendingFetch) {
		return pendingFetch;
	}

	pendingFetch = fetch("/api/settings/public")
		.then((res) => (res.ok ? res.json() : { settings: {} }))
		.then((data) => {
			cachedSettings = data.settings || {};
			return cachedSettings as PublicSettings;
		})
		.catch((err) => {
			console.error("Failed to load public settings on client:", err);
			return {};
		})
		.finally(() => {
			pendingFetch = null;
		});

	return pendingFetch;
}
