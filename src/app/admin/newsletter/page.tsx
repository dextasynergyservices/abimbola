"use client";

import { Loader2, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriberItem {
	id: string;
	firstName: string;
	email: string;
	createdAt: string;
}

export default function AdminNewsletterPage() {
	const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleteTarget, setDeleteTarget] = useState<SubscriberItem | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	const fetchSubscribers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/newsletter");
			if (!res.ok) throw new Error("Failed to fetch subscribers");
			const data = await res.json();
			setSubscribers(data.subscribers || []);
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to load subscribers");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSubscribers();
	}, [fetchSubscribers]);

	const handleDelete = async (subscriber: SubscriberItem) => {
		setActionLoading(true);
		try {
			const res = await fetch(`/api/admin/newsletter/${subscriber.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to remove subscriber");
			toast.success("Subscriber removed");
			setDeleteTarget(null);
			await fetchSubscribers();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to remove subscriber");
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<div className="flex items-center space-x-2">
					<Users className="h-6 w-6 text-amber-600" />
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
						Newsletter
					</h1>
				</div>
				<p className="text-sm text-slate-500 mt-1">
					Everyone who signed up for &ldquo;Get the Letters&rdquo; on the
					homepage.
				</p>
			</div>

			{loading ? (
				<Card className="p-6 border-slate-200 bg-white space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={`sub-skel-${i}`} className="h-12 w-full" />
					))}
				</Card>
			) : subscribers.length === 0 ? (
				<Card className="p-12 text-center border-slate-200 bg-white shadow-xs">
					<Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
					<h3 className="text-lg font-semibold text-slate-900">
						No subscribers yet
					</h3>
					<p className="text-sm text-slate-500 mt-1">
						Signups from the homepage newsletter form will appear here.
					</p>
				</Card>
			) : (
				<Card className="border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
					{subscribers.map((subscriber) => (
						<div
							key={subscriber.id}
							className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5"
						>
							<div className="min-w-0">
								<p className="text-sm font-semibold text-slate-900 truncate">
									{subscriber.firstName}
								</p>
								<p className="text-xs text-slate-500 truncate">
									{subscriber.email}
								</p>
							</div>
							<div className="shrink-0 flex items-center gap-3">
								<span className="text-xs text-slate-400">
									{new Date(subscriber.createdAt).toLocaleDateString()}
								</span>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-slate-400 hover:text-rose-600"
									onClick={() => setDeleteTarget(subscriber)}
								>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">Remove subscriber</span>
								</Button>
							</div>
						</div>
					))}
				</Card>
			)}

			{deleteTarget && (
				<AlertDialog
					open={!!deleteTarget}
					onOpenChange={(open) => !open && setDeleteTarget(null)}
				>
					<AlertDialogContent className="max-w-md w-[92vw] bg-white border-slate-200">
						<AlertDialogHeader>
							<AlertDialogTitle className="text-slate-900 font-bold">
								Remove &ldquo;{deleteTarget.firstName}&rdquo; from the list?
							</AlertDialogTitle>
							<AlertDialogDescription className="text-slate-500 text-sm">
								They will stop being counted as a subscriber. This cannot be
								undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className="mt-4">
							<AlertDialogCancel disabled={actionLoading}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => handleDelete(deleteTarget)}
								disabled={actionLoading}
								className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
							>
								{actionLoading ? (
									<Loader2 className="h-4 w-4 animate-spin mr-1.5" />
								) : null}
								Remove Subscriber
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
}
