"use client";

import {
	Check,
	FolderOpen,
	Image as ImageIcon,
	Loader2,
	Plus,
	RefreshCw,
	Search,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface MediaItem {
	id: string;
	cloudinaryPublicId: string;
	secureUrl: string;
	width?: number | null;
	height?: number | null;
	altText?: string | null;
	caption?: string | null;
	createdAt?: string;
}

interface MediaPickerModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectImage: (media: MediaItem) => void;
	selectedImageId?: string | null;
	title?: string;
}

export function MediaPickerModal({
	open,
	onOpenChange,
	onSelectImage,
	selectedImageId,
	title = "Select Media",
}: MediaPickerModalProps) {
	const [mediaList, setMediaList] = useState<MediaItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeSelected, setActiveSelected] = useState<MediaItem | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchMedia = useCallback(
		async (query = "") => {
			setLoading(true);
			try {
				const res = await fetch(
					`/api/admin/media${query ? `?query=${encodeURIComponent(query)}` : ""}`,
				);
				if (!res.ok) throw new Error("Failed to load media library");
				const data = await res.json();
				const list: MediaItem[] = data.media || [];
				setMediaList(list);

				if (selectedImageId && !activeSelected) {
					const found = list.find((item) => item.id === selectedImageId);
					if (found) setActiveSelected(found);
				}
			} catch (err) {
				console.error(err);
				toast.error("Failed to load media items");
			} finally {
				setLoading(false);
			}
		},
		[selectedImageId, activeSelected],
	);

	useEffect(() => {
		if (open) {
			fetchMedia(searchQuery);
		}
	}, [open, fetchMedia, searchQuery]);

	const [uploadProgress, setUploadProgress] = useState(0);

	const handleFileUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setUploading(true);
		setUploadProgress(0);

		try {
			const file = files[0];
			if (!file.type.startsWith("image/")) {
				toast.error("Selected file is not an image");
				return;
			}

			const sigRes = await fetch("/api/admin/upload/signature", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ folder: "abimbola_uploads" }),
			});

			if (!sigRes.ok) {
				const sigErr = await sigRes.json().catch(() => ({}));
				throw new Error(sigErr?.error || "Failed to get signature");
			}
			const sigData = await sigRes.json();

			let secureUrl = "";
			let cloudinaryPublicId = "";
			let width: number | null = null;
			let height: number | null = null;

			if (sigData.isMock) {
				setUploadProgress(50);
				const base64 = await new Promise<string>((resolve) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result as string);
					reader.readAsDataURL(file);
				});

				const imgDimensions = await new Promise<{ w: number; h: number }>(
					(resolve) => {
						const img = new window.Image();
						img.onload = () => resolve({ w: img.width, h: img.height });
						img.src = base64;
					},
				);

				secureUrl = base64;
				cloudinaryPublicId = `mock_upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
				width = imgDimensions.w;
				height = imgDimensions.h;
				setUploadProgress(90);
			} else {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("api_key", sigData.apiKey);
				formData.append("timestamp", String(sigData.timestamp));
				formData.append("signature", sigData.signature);
				if (sigData.folder) formData.append("folder", sigData.folder);

				const uploadData = await new Promise<{
					secure_url: string;
					public_id: string;
					width?: number;
					height?: number;
				}>((resolve, reject) => {
					const xhr = new XMLHttpRequest();
					xhr.open(
						"POST",
						`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
					);

					xhr.upload.onprogress = (event) => {
						if (event.lengthComputable) {
							const percent = Math.round((event.loaded / event.total) * 90);
							setUploadProgress(percent);
						}
					};

					xhr.onload = () => {
						try {
							const response = JSON.parse(xhr.responseText);
							if (xhr.status >= 200 && xhr.status < 300) {
								resolve(response);
							} else {
								const errorMsg =
									response?.error?.message ||
									`Cloudinary error (${xhr.status}: ${xhr.statusText})`;
								reject(new Error(errorMsg));
							}
						} catch {
							reject(new Error(`Upload failed with status ${xhr.status}`));
						}
					};

					xhr.onerror = () =>
						reject(new Error("Network error during Cloudinary upload"));
					xhr.send(formData);
				});

				secureUrl = uploadData.secure_url;
				cloudinaryPublicId = uploadData.public_id;
				width = uploadData.width || null;
				height = uploadData.height || null;
			}

			setUploadProgress(95);

			const saveRes = await fetch("/api/admin/media", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					cloudinaryPublicId,
					secureUrl,
					width,
					height,
					altText: file.name.split(".")[0].replace(/[-_]/g, " "),
				}),
			});

			if (!saveRes.ok) {
				const saveErr = await saveRes.json().catch(() => ({}));
				throw new Error(saveErr?.error || "Failed to save media");
			}
			const saveJson = await saveRes.json();

			setUploadProgress(100);
			toast.success("Image uploaded to library");
			await fetchMedia(searchQuery);
			if (saveJson.media) {
				setActiveSelected(saveJson.media);
			}
		} catch (err: unknown) {
			console.error(err);
			toast.error((err as Error).message || "Failed to upload image");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleConfirmSelect = () => {
		if (activeSelected) {
			onSelectImage(activeSelected);
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-4 sm:p-6 bg-white">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
						<FolderOpen className="h-5 w-5 text-amber-600" />
						{title}
					</DialogTitle>
					<DialogDescription className="text-sm text-slate-500">
						Select an image from your library or upload a new image.
					</DialogDescription>
				</DialogHeader>

				{/* Search & Quick Upload */}
				<div className="flex flex-col sm:flex-row items-center gap-3 my-3">
					<div className="relative flex-1 w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder="Search by alt text or public ID..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 pr-4 min-h-[44px] sm:min-h-[38px]"
						/>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={() => fetchMedia(searchQuery)}
							disabled={loading}
							className="min-h-[44px] sm:min-h-[38px]"
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
							/>
							Refresh
						</Button>

						<label className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-3 py-2 text-sm shadow-sm transition-colors min-h-[44px]">
							{uploading ? (
								<div className="flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin text-slate-950" />
									<span className="text-xs">{uploadProgress}%</span>
								</div>
							) : (
								<>
									<Plus className="h-4 w-4 mr-1.5" />
									Upload New
								</>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								disabled={uploading}
								className="hidden"
								onChange={(e) => handleFileUpload(e.target.files)}
							/>
						</label>
					</div>
				</div>

				{/* Uploading progress banner */}
				{uploading && (
					<div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col gap-1.5 animate-in fade-in">
						<div className="flex items-center justify-between text-xs font-semibold text-amber-800">
							<span className="flex items-center gap-1.5">
								<Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
								Uploading to Cloudinary & Media Library...
							</span>
							<span>{uploadProgress}%</span>
						</div>
						<div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
							<div
								className="bg-amber-600 h-full transition-all duration-150"
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					</div>
				)}

				{/* Grid Container */}
				<div className="flex-1 overflow-y-auto min-h-[280px] border border-slate-200 rounded-xl p-3 bg-slate-50">
					{loading && mediaList.length === 0 ? (
						<div className="flex items-center justify-center h-48 text-slate-400">
							<Loader2 className="h-6 w-6 animate-spin mr-2" />
							Loading media library...
						</div>
					) : mediaList.length === 0 ? (
						<div className="text-center py-12 text-slate-400">
							<ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm font-medium">No media found</p>
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
							{mediaList.map((media) => {
								const isSelected = activeSelected?.id === media.id;
								return (
									<Card
										key={media.id}
										onClick={() => setActiveSelected(media)}
										onDoubleClick={() => {
											onSelectImage(media);
											onOpenChange(false);
										}}
										className={`relative aspect-square cursor-pointer overflow-hidden border-2 transition-all ${
											isSelected
												? "border-amber-500 ring-2 ring-amber-500/20 shadow-md scale-[1.02]"
												: "border-slate-200 hover:border-slate-400"
										}`}
									>
										<Image
											src={media.secureUrl}
											alt={media.altText || "Library image"}
											fill
											sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
											className="object-cover"
										/>
										{isSelected && (
											<div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
												<Check className="h-4 w-4 stroke-[3]" />
											</div>
										)}
										<div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-1.5 text-[11px] text-white truncate">
											{media.altText || media.cloudinaryPublicId}
										</div>
									</Card>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer Controls */}
				<div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-2">
					<span className="text-xs text-slate-500">
						{activeSelected
							? `Selected: ${activeSelected.altText || activeSelected.cloudinaryPublicId}`
							: "No image selected"}
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="min-h-[44px] px-4"
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmSelect}
							disabled={!activeSelected}
							className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold min-h-[44px] px-5"
						>
							Select Image
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
