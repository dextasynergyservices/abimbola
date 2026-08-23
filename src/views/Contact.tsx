"use client";

import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { PublishedPage } from "@/lib/cms";

interface ContactProps {
	publishedPage?: PublishedPage | null;
}

interface PublicSettings {
	contactEmail?: string | null;
	contactPhone?: string | null;
	address?: string | null;
}

const Contact = ({ publishedPage: _publishedPage }: ContactProps) => {
	const [settings, setSettings] = useState<PublicSettings>({});
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		fetch("/api/settings/public")
			.then((res) => res.json())
			.then((data) => setSettings(data.settings || {}))
			.catch(() => {});
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !email.trim() || !message.trim()) {
			toast.error("Please fill in your name, email, and message.");
			return;
		}

		setSubmitting(true);
		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					subject: subject.trim() || null,
					message: message.trim(),
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to send message");

			toast.success("Message sent! We'll get back to you soon.");
			setName("");
			setEmail("");
			setSubject("");
			setMessage("");
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to send message");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			<Navigation />

			<section className="bg-gradient-to-br from-secondary/10 via-primary/10 to-accent/10 section-padding">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
						Get in Touch
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl">
						We'd love to hear from you. Send us a message and we'll respond as
						soon as possible.
					</p>
				</div>
			</section>

			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid lg:grid-cols-2 gap-12">
					{/* Contact Form */}
					<Card>
						<CardContent className="pt-6">
							<form className="space-y-6" onSubmit={handleSubmit}>
								<div>
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										placeholder="Your name"
										className="mt-2"
										value={name}
										onChange={(e) => setName(e.target.value)}
									/>
								</div>

								<div>
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										placeholder="your@email.com"
										className="mt-2"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>

								<div>
									<Label htmlFor="subject">Subject</Label>
									<Input
										id="subject"
										placeholder="What's this about?"
										className="mt-2"
										value={subject}
										onChange={(e) => setSubject(e.target.value)}
									/>
								</div>

								<div>
									<Label htmlFor="message">Message</Label>
									<Textarea
										id="message"
										placeholder="Tell us more..."
										rows={6}
										className="mt-2"
										value={message}
										onChange={(e) => setMessage(e.target.value)}
									/>
								</div>

								<Button type="submit" className="w-full" disabled={submitting}>
									{submitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Sending...
										</>
									) : (
										"Send Message"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Contact Information */}
					<div className="space-y-8">
						<div>
							<h2 className="text-3xl font-display font-bold mb-6">
								Contact Information
							</h2>
							<p className="text-muted-foreground mb-8">
								Have a question about our blog or bookstore? Want to collaborate
								or contribute? We're here to help.
							</p>
						</div>

						<Card>
							<CardContent className="pt-6 space-y-6">
								<div className="flex items-start gap-4">
									<Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
									<div>
										<h3 className="font-semibold mb-1">Email</h3>
										<p className="text-muted-foreground">
											{settings.contactEmail || "hello@abimbolalawuyi.com"}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
									<div>
										<h3 className="font-semibold mb-1">Phone</h3>
										<p className="text-muted-foreground">
											{settings.contactPhone || "+234 012 345 6789"}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
									<div>
										<h3 className="font-semibold mb-1">Address</h3>
										<p className="text-muted-foreground">
											{settings.address || "Lagos, Nigeria"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-gradient-to-br from-primary/5 to-accent/5">
							<CardContent className="pt-6">
								<h3 className="font-display font-semibold text-lg mb-2">
									Business Hours
								</h3>
								<div className="space-y-1 text-sm text-muted-foreground">
									<p>Monday - Friday: 9:00 AM - 6:00 PM</p>
									<p>Saturday: 10:00 AM - 4:00 PM</p>
									<p>Sunday: Closed</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	);
};

export default Contact;
