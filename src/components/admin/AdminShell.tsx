"use client";

import { AdminHeader } from "./AdminHeader";
import { AdminSidebarDesktop } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
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
