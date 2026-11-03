"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageview } from "@/lib/analytics/track";

/**
 * Mount once in the root layout. Records a pageview on every route change;
 * the tracker batches everything and sends it once per visit.
 */
export function AnalyticsScript() {
	const pathname = usePathname();

	useEffect(() => {
		if (pathname) trackPageview(pathname);
	}, [pathname]);

	return null;
}
