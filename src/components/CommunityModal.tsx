"use client";

import {
	Facebook,
	Gamepad2,
	Loader2,
	MessageCircle,
	Send,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import {
	getClientPublicSettings,
	type PublicSettings,
} from "@/lib/public-settings";

interface CommunityModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const CHANNELS = [
	{
		key: "whatsappUrl" as const,
		label: "WhatsApp Community",
		icon: MessageCircle,
		color: "text-emerald-600 bg-emerald-50",
	},
	{
		key: "telegramUrl" as const,
		label: "Telegram Community",
		icon: Send,
		color: "text-sky-600 bg-sky-50",
	},
	{
		key: "facebookUrl" as const,
		label: "Facebook Group",
		icon: Facebook,
		color: "text-blue-600 bg-blue-50",
	},
	{
		key: "discordUrl" as const,
		label: "Discord Server",
		icon: Gamepad2,
		color: "text-indigo-600 bg-indigo-50",
	},
];

export function CommunityModal({ open, onOpenChange }: CommunityModalProps) {
	const [settings, setSettings] = useState<PublicSettings | null>(null);

	useEffect(() => {
		if (!open) return;
		getClientPublicSettings().then((data) => {
			setSettings(data);
		});
	}, [open]);

	const availableChannels = settings
		? CHANNELS.filter(
				(channel) =>
					Boolean(settings[channel.key]) &&
					typeof settings[channel.key] === "string" &&
					(settings[channel.key] as string).trim() !== "",
			)
		: [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md w-[92vw] bg-white">
				<DialogHeader>
					<DialogTitle className="font-display text-2xl">
						Join the Community
					</DialogTitle>
					<DialogDescription>
						Connect with Abimbola and other members through any of these
						channels.
					</DialogDescription>
				</DialogHeader>

				{settings === null ? (
					<div className="flex items-center justify-center py-10 text-neutral-400">
						<Loader2 className="h-5 w-5 animate-spin mr-2" />
						Loading...
					</div>
				) : availableChannels.length === 0 ? (
					<div className="text-center py-10 text-neutral-500">
						<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
						<p className="text-sm">No community channels added yet.</p>
					</div>
				) : (
					<div className="space-y-3">
						{availableChannels.map((channel) => {
							const Icon = channel.icon;
							const url = settings?.[channel.key] as string;
							return (
								<a
									key={channel.key}
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
								>
									<span
										className={`flex h-10 w-10 items-center justify-center rounded-full ${channel.color}`}
									>
										<Icon className="h-5 w-5" />
									</span>
									<span className="font-medium text-black">
										{channel.label}
									</span>
								</a>
							);
						})}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
