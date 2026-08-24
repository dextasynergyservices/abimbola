"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebarDesktop } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.replace("/admin/login");
		}
	}, [status, router]);

	if (status === "loading") {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<div className="flex flex-col items-center gap-3 text-slate-500">
					<Loader2 className="h-8 w-8 animate-spin text-amber-600" />
					<span className="text-sm font-medium">Verifying session...</span>
				</div>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
			<AdminSidebarDesktop />
			<div className="lg:pl-64 flex flex-col flex-1 min-w-0">
				<AdminHeader />
				<main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
					{children}
				</main>
			</div>
		</div>
	);
}
