"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { AdminShell } from "./AdminShell";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	if (pathname === "/admin/login") {
		return <>{children}</>;
	}

	return (
		<SessionProvider refetchOnWindowFocus={false}>
			<AdminShell>{children}</AdminShell>
		</SessionProvider>
	);
}
