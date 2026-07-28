"use client";

import {
	Facebook,
	Gamepad2,
	HardDrive,
	Instagram,
	Loader2,
	MessageCircle,
	Save,
	Send,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsData {
	contactEmail: string | null;
	contactPhone: string | null;
	address: string | null;
	instagramUrl: string | null;
	facebookUrl: string | null;
	whatsappUrl: string | null;
	telegramUrl: string | null;
	discordUrl: string | null;
	tiktokUrl: string | null;
	youtubeUrl: string | null;
}

const emptySettings: SettingsData = {
	contactEmail: "",
	contactPhone: "",
	address: "",
	instagramUrl: "",
	facebookUrl: "",
	whatsappUrl: "",
	telegramUrl: "",
	discordUrl: "",
	tiktokUrl: "",
	youtubeUrl: "",
};

export default function AdminSettingsScreen() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [settings, setSettings] = useState<SettingsData>(emptySettings);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/admin/settings");
				if (!res.ok) throw new Error("Failed to load settings");
				const data = await res.json();
				setSettings({ ...emptySettings, ...data.settings });
			} catch (err) {
				console.error(err);
				toast.error("Failed to load settings");
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const updateField = (field: keyof SettingsData, value: string) => {
		setSettings((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetch("/api/admin/settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(settings),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to save settings");
			toast.success("Website settings updated successfully!");
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to save settings");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-24 text-slate-400">
				<Loader2 className="h-6 w-6 animate-spin mr-2" />
				Loading settings...
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-5xl mx-auto">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
						System Settings
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						Manage contact details, social handles, and community links shown
						across the public website.
					</p>
				</div>
				<Button
					onClick={handleSave}
					disabled={saving}
					className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs min-h-[44px] self-end sm:self-auto"
				>
					<Save className="mr-1.5 h-4 w-4 text-slate-950" />
					{saving ? "Saving..." : "Save Settings"}
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Contact Info */}
				<Card className="border-slate-200 bg-white shadow-xs">
					<CardHeader>
						<CardTitle className="text-lg font-bold text-slate-900 flex items-center">
							<HardDrive className="h-5 w-5 mr-2 text-amber-600" />
							Contact Information
						</CardTitle>
						<CardDescription className="text-xs text-slate-500">
							Shown on the public Contact page and site footer.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label
								htmlFor="setting-email"
								className="text-slate-700 font-medium"
							>
								Contact Email
							</Label>
							<Input
								id="setting-email"
								type="email"
								value={settings.contactEmail || ""}
								onChange={(e) => updateField("contactEmail", e.target.value)}
								className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
							/>
						</div>

						<div>
							<Label
								htmlFor="setting-phone"
								className="text-slate-700 font-medium"
							>
								Phone Number
							</Label>
							<Input
								id="setting-phone"
								value={settings.contactPhone || ""}
								onChange={(e) => updateField("contactPhone", e.target.value)}
								className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
							/>
						</div>

						<div>
							<Label
								htmlFor="setting-address"
								className="text-slate-700 font-medium"
							>
								Address
							</Label>
							<Input
								id="setting-address"
								value={settings.address || ""}
								onChange={(e) => updateField("address", e.target.value)}
								className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Social & Community Links */}
				<Card className="border-slate-200 bg-white shadow-xs">
					<CardHeader>
						<CardTitle className="text-lg font-bold text-slate-900 flex items-center">
							<Users className="h-5 w-5 mr-2 text-emerald-600" />
							Social & Community Links
						</CardTitle>
						<CardDescription className="text-xs text-slate-500">
							Leave a field blank to hide that icon/channel everywhere on the
							site.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label className="text-slate-700 font-medium flex items-center">
								<Instagram className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
								Instagram URL
							</Label>
							<Input
								value={settings.instagramUrl || ""}
								onChange={(e) => updateField("instagramUrl", e.target.value)}
								placeholder="https://instagram.com/yourhandle"
								className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px] text-xs"
							/>
						</div>

						<div>
							<Label className="text-slate-700 font-medium flex items-center">
								<Facebook className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
								Facebook URL
							</Label>
							<Input
								value={settings.facebookUrl || ""}
								onChange={(e) => updateField("facebookUrl", e.target.value)}
								placeholder="https://facebook.com/yourpage"
								className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px] text-xs"
							/>
						</div>

						<div>
							<Label className="text-slate-700 font-medium flex items-center">
								<MessageCircle className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
								WhatsApp Community Link
							</Label>
							<Input
								value={settings.whatsappUrl || ""}
								onChange={(e) => updateField("whatsappUrl", e.target.value)}
								placeholder="https://chat.whatsapp.com/..."
								className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px] text-xs"
							/>
						</div>

						<div>
							<Label className="text-slate-700 font-medium flex items-center">
								<Send className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
								Telegram Community Link
							</Label>
							<Input
								value={settings.telegramUrl || ""}
								onChange={(e) => updateField("telegramUrl", e.target.value)}
								placeholder="https://t.me/..."
								className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px] text-xs"
							/>
						</div>

						<div>
							<Label className="text-slate-700 font-medium flex items-center">
								<Gamepad2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
								Discord Community Link
							</Label>
							<Input
								value={settings.discordUrl || ""}
								onChange={(e) => updateField("discordUrl", e.target.value)}
								placeholder="https://discord.gg/..."
								className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px] text-xs"
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
