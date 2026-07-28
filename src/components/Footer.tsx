"use client";

import { Facebook, Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommunityModal } from "@/components/CommunityModal";

const logo =
	"https://res.cloudinary.com/dxoorukfj/image/upload/v1782315132/Abimbola_LOGO_white_pwezaa.png";

interface PublicSettings {
	contactEmail?: string | null;
	instagramUrl?: string | null;
	facebookUrl?: string | null;
}

const Footer = () => {
	const [settings, setSettings] = useState<PublicSettings>({});
	const [communityOpen, setCommunityOpen] = useState(false);

	useEffect(() => {
		fetch("/api/settings/public")
			.then((res) => res.json())
			.then((data) => setSettings(data.settings || {}))
			.catch(() => {});
	}, []);

	const email = settings.contactEmail || "hello@abimbolalawuyi.com";
	const instagramUrl =
		settings.instagramUrl || "https://instagram.com/abimbolawrites";
	const facebookUrl =
		settings.facebookUrl ||
		"https://www.facebook.com/people/AbimbolaWrites/61567294645489/";

	return (
		<footer className="bg-black text-white">
			<div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
					{/* Brand */}
					<div className="space-y-5">
						<Link href="/" className="inline-block">
							<img src={logo} alt="Abimbola Lawuyi" className="h-20 w-auto" />
						</Link>
						<p className="text-neutral-400 text-sm leading-relaxed max-w-xs">
							A Lady with a Pen and a Purpose.
							<br />
							<em>God Inspires. I write.</em>
						</p>
						<div className="flex gap-4 pt-1">
							{instagramUrl && (
								<a
									href={instagramUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-neutral-400 hover:text-gold transition-colors duration-300"
									aria-label="Instagram"
								>
									<Instagram className="h-5 w-5" />
								</a>
							)}
							{facebookUrl && (
								<a
									href={facebookUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-neutral-400 hover:text-gold transition-colors duration-300"
									aria-label="Facebook"
								>
									<Facebook className="h-5 w-5" />
								</a>
							)}
							<a
								href={`mailto:${email}`}
								className="text-neutral-400 hover:text-gold transition-colors duration-300"
								aria-label="Email"
							>
								<Mail className="h-5 w-5" />
							</a>
						</div>
					</div>

					{/* Navigation */}
					<div>
						<h3 className="text-xs font-medium tracking-widest uppercase text-neutral-400 mb-6">
							Navigate
						</h3>
						<ul className="space-y-3">
							{[
								{ name: "Home", path: "/" },
								{ name: "About", path: "#about" },
								{ name: "Blog", path: "/blog" },
								{ name: "Books", path: "/books" },
								{ name: "Community", path: "#community" },
							].map((link) =>
								link.name === "Community" ? (
									<li key={link.name}>
										<button
											type="button"
											onClick={() => setCommunityOpen(true)}
											className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
										>
											{link.name}
										</button>
									</li>
								) : (
									<li key={link.name}>
										<Link
											href={
												link.path.startsWith("#") ? `/${link.path}` : link.path
											}
											className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
										>
											{link.name}
										</Link>
									</li>
								),
							)}
						</ul>
					</div>

					{/* Connect */}
					<div>
						<h3 className="text-xs font-medium tracking-widest uppercase text-neutral-400 mb-6">
							Connect
						</h3>
						<ul className="space-y-3">
							<li>
								<Link
									href="/#newsletter"
									className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
								>
									Newsletter
								</Link>
							</li>
							{instagramUrl && (
								<li>
									<a
										href={instagramUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
									>
										Instagram
									</a>
								</li>
							)}
							{facebookUrl && (
								<li>
									<a
										href={facebookUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
									>
										Facebook
									</a>
								</li>
							)}
							<li>
								<a
									href={`mailto:${email}`}
									className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
								>
									{email}
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-14 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-xs text-neutral-500">
						© {new Date().getFullYear()} Abimbola Lawuyi. All rights reserved.
					</p>
					<p className="text-xs text-neutral-600 italic">
						AbimbolaWrites, the writing & publishing arm
					</p>
				</div>
			</div>

			<CommunityModal open={communityOpen} onOpenChange={setCommunityOpen} />
		</footer>
	);
};

export default Footer;
