"use client";

import {
	BookOpen,
	ChevronRight,
	FileText,
	LayoutDashboard,
	Menu,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const logo =
	"https://res.cloudinary.com/dxoorukfj/image/upload/v1782312802/Abimbola_LOGO_3_ms0jyd.png";

const navigationItems = [
	{
		title: "Dashboard",
		href: "/admin",
		icon: LayoutDashboard,
	},
	{
		title: "Books",
		href: "/admin/books",
		icon: BookOpen,
	},
	{
		title: "Blog",
		href: "/admin/posts",
		icon: FileText,
	},
	{
		title: "Newsletter",
		href: "/admin/newsletter",
		icon: Users,
	},
	{
		title: "Settings",
		href: "/admin/settings",
		icon: Settings,
	},
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();

	return (
		<div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200">
			<div className="p-6 border-b border-slate-150 flex items-center space-x-3">
				<img src={logo} alt="Abimbola Lawuyi" className="h-10 w-auto" />
				<p className="text-xs text-slate-500">Admin Control Center</p>
			</div>

			<nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
				{navigationItems.map((item) => {
					const isActive =
						item.href === "/admin"
							? pathname === "/admin"
							: pathname.startsWith(item.href);
					const Icon = item.icon;

					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onNavigate}
							className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
								isActive
									? "bg-amber-50 text-amber-700 border border-amber-200 font-semibold shadow-xs"
									: "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
							}`}
						>
							<div className="flex items-center space-x-3">
								<Icon
									className={`h-5 w-5 ${isActive ? "text-amber-600" : "text-slate-400"}`}
								/>
								<span>{item.title}</span>
							</div>
							{isActive && <ChevronRight className="h-4 w-4 text-amber-600" />}
						</Link>
					);
				})}
			</nav>

			<div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
				Version 1.0.0 &bull; Neon & Prisma 7
			</div>
		</div>
	);
}

/** Fixed, always-visible sidebar for desktop (lg+) viewports. Mount once. */
export function AdminSidebarDesktop() {
	return (
		<aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30">
			<NavContent />
		</aside>
	);
}

/** Hamburger trigger + slide-out sheet for mobile viewports. Mount once, inside the header. */
export function AdminSidebarMobile() {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div className="lg:hidden">
			<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
				<SheetTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
					>
						<Menu className="h-6 w-6" />
						<span className="sr-only">Toggle navigation menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent
					side="left"
					className="p-0 w-72 bg-white border-slate-200"
				>
					<SheetHeader className="sr-only">
						<SheetTitle>Admin Navigation</SheetTitle>
					</SheetHeader>
					<NavContent onNavigate={() => setMobileOpen(false)} />
				</SheetContent>
			</Sheet>
		</div>
	);
}
