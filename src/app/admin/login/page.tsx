"use client";

import { AlertCircle, Lock, LogIn, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/admin";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (res?.error) {
				setError("Invalid email or password. Please try again.");
				setLoading(false);
			} else {
				router.push(callbackUrl);
				router.refresh();
			}
		} catch (_err) {
			setError("An unexpected error occurred. Please try again.");
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			{error && (
				<Alert
					variant="destructive"
					className="border-red-900/50 bg-red-950/40 text-red-300"
				>
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Authentication Failed</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="space-y-2">
				<Label htmlFor="email" className="text-sm font-medium text-neutral-300">
					Email Address
				</Label>
				<div className="relative">
					<Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
					<Input
						id="email"
						type="email"
						placeholder="admin@abimbolalawuyi.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="h-11 pl-10 border-neutral-800 bg-neutral-950/60 text-white placeholder:text-neutral-600 focus:border-amber-500 focus:ring-amber-500/20"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label
					htmlFor="password"
					className="text-sm font-medium text-neutral-300"
				>
					Password
				</Label>
				<div className="relative">
					<Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
					<Input
						id="password"
						type="password"
						placeholder="••••••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						className="h-11 pl-10 border-neutral-800 bg-neutral-950/60 text-white placeholder:text-neutral-600 focus:border-amber-500 focus:ring-amber-500/20"
					/>
				</div>
			</div>

			<Button
				type="submit"
				disabled={loading}
				className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 font-semibold text-neutral-950 hover:from-amber-400 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-amber-500/10 active:scale-[0.99]"
			>
				{loading ? (
					<div className="flex items-center space-x-2">
						<span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
						<span>Authenticating...</span>
					</div>
				) : (
					<div className="flex items-center space-x-2">
						<LogIn className="h-4 w-4" />
						<span>Sign In to Dashboard</span>
					</div>
				)}
			</Button>
		</form>
	);
}

export default function AdminLoginPage() {
	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-4 sm:p-6 lg:p-8">
			<Card className="w-full max-w-md border-neutral-800 bg-neutral-900/90 text-neutral-100 shadow-2xl backdrop-blur-md">
				<CardHeader className="space-y-2 text-center pb-6">
					<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
						<Lock className="h-6 w-6" />
					</div>
					<CardTitle className="text-2xl font-bold tracking-tight text-white">
						Admin Portal
					</CardTitle>
					<CardDescription className="text-neutral-400 text-sm">
						Sign in to access the Abimbola Lawuyi Content Management System
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Suspense
						fallback={
							<div className="py-8 text-center text-sm text-neutral-400 animate-pulse">
								Loading Admin Portal...
							</div>
						}
					>
						<LoginForm />
					</Suspense>
				</CardContent>
			</Card>
		</div>
	);
}
