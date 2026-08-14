const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

// Publication dates are stored as naive wall-clock strings ("2026-10-15T14:00")
// so they render identically on the server and in the browser.
const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

// Times are entered and displayed in West Africa Time.
export const PUBLICATION_TIMEZONE = "WAT";

/**
 * Formats a stored publication date for display, e.g.
 * "2026-10-15T14:00" -> "October 15, 2026 at 2:00 PM WAT".
 * Values saved before the date picker existed (e.g. "2025") are shown as-is.
 */
export function formatPublicationDate(value?: string | null): string {
	const raw = value?.trim();
	if (!raw) return "";

	const match = WALL_CLOCK.exec(raw);
	if (!match) return raw;

	const [, year, month, day, hours, minutes] = match;
	const monthIndex = Number(month) - 1;
	if (monthIndex < 0 || monthIndex > 11) return raw;

	const datePart = `${MONTHS[monthIndex]} ${Number(day)}, ${year}`;
	if (hours === undefined) return datePart;

	const hour24 = Number(hours);
	const period = hour24 >= 12 ? "PM" : "AM";
	const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
	return `${datePart} at ${hour12}:${minutes} ${period} ${PUBLICATION_TIMEZONE}`;
}

/**
 * Converts a stored publication date into the `YYYY-MM-DDTHH:mm` value a
 * `datetime-local` input expects. Returns "" for legacy free-text values.
 */
export function toDateTimeLocalValue(value?: string | null): string {
	const raw = value?.trim();
	if (!raw) return "";

	const match = WALL_CLOCK.exec(raw);
	if (!match) return "";

	const [, year, month, day, hours, minutes] = match;
	return `${year}-${month}-${day}T${hours ?? "00"}:${minutes ?? "00"}`;
}
