"use client";

import { LogOut, Plus, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSidebarMobile } from "./AdminSidebar";

const logo =
	"https://res.cloudinary.com/dxoorukfj/image/upload/v1782312802/Abimbola_LOGO_3_ms0jyd.png";

export function AdminHeader() {
	const { data: session } = useSession();
	const user = session?.user;

	return (
		<header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-6 backdrop-blur-md">
			<div className="flex items-center space-x-3">
				<AdminSidebarMobile />
				<Link href="/admin" className="lg:hidden flex items-center">
					<img src={logo} alt="Abimbola Lawuyi" className="h-8 w-auto" />
				</Link>
			</div>

			<div className="flex items-center space-x-3 sm:space-x-4">
				<Button
					asChild
					size="sm"
					className="hidden sm:inline-flex bg-amber-500 text-slate-950 hover:bg-amber-400 font-medium text-xs sm:text-sm shadow-xs"
				>
					<Link href="/admin/books/new">
						<Plus className="mr-1.5 h-4 w-4" />
						New Book
					</Link>
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex items-center space-x-2.5 px-2 hover:bg-slate-100 text-slate-800"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
								<UserIcon className="h-4 w-4" />
							</div>
							<span className="hidden md:inline-block font-medium text-sm text-slate-800">
								{user?.name || user?.email || "Admin User"}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-56 border-slate-200 bg-white text-slate-800 shadow-xl"
					>
						<DropdownMenuLabel className="font-normal">
							<div className="flex flex-col space-y-1">
								<p className="text-sm font-semibold text-slate-900 leading-none">
									{user?.name || "Admin"}
								</p>
								<p className="text-xs text-slate-500 leading-none truncate">
									{user?.email || "admin@abimbolalawuyi.com"}
								</p>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-slate-100" />
						<DropdownMenuItem
							onClick={() => signOut({ callbackUrl: "/admin/login" })}
							className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
						>
							<LogOut className="mr-2 h-4 w-4" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
