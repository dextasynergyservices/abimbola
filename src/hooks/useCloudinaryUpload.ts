"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface UploadedMedia {
	id: string;
	cloudinaryPublicId: string;
	secureUrl: string;
	width?: number | null;
	height?: number | null;
	altText?: string | null;
	caption?: string | null;
}

/**
 * Hook that handles direct Cloudinary upload + saving to the media DB.
 * Returns the saved MediaItem so consumers can immediately use it.
 */
export function useCloudinaryUpload() {
	const [uploading, setUploading] = useState(false);

	const upload = useCallback(
		async (files: FileList | null): Promise<UploadedMedia | null> => {
			if (!files || files.length === 0) return null;
			setUploading(true);

			try {
				const file = files[0];
				if (!file.type.startsWith("image/")) {
					toast.error("Selected file is not an image");
					return null;
				}

				// 1. Get Cloudinary signature
				const sigRes = await fetch("/api/admin/upload/signature", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ folder: "abimbola_uploads" }),
				});

				if (!sigRes.ok) throw new Error("Failed to get upload signature");
				const sigData = await sigRes.json();

				let secureUrl = "";
				let cloudinaryPublicId = "";
				let width: number | null = null;
				let height: number | null = null;

				if (sigData.isMock) {
					// Dev / mock mode – read as base64
					const base64 = await new Promise<string>((resolve) => {
						const reader = new FileReader();
						reader.onloadend = () => resolve(reader.result as string);
						reader.readAsDataURL(file);
					});

					const imgDimensions = await new Promise<{
						w: number;
						h: number;
					}>((resolve) => {
						const img = new window.Image();
						img.onload = () => resolve({ w: img.width, h: img.height });
						img.src = base64;
					});

					secureUrl = base64;
					cloudinaryPublicId = `mock_upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
					width = imgDimensions.w;
					height = imgDimensions.h;
				} else {
					// 2. Upload to Cloudinary
					const formData = new FormData();
					formData.append("file", file);
					formData.append("api_key", sigData.apiKey);
					formData.append("timestamp", String(sigData.timestamp));
					formData.append("signature", sigData.signature);
					if (sigData.folder) formData.append("folder", sigData.folder);

					const uploadRes = await fetch(
						`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
						{ method: "POST", body: formData },
					);

					if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
					const uploadData = await uploadRes.json();
					secureUrl = uploadData.secure_url;
					cloudinaryPublicId = uploadData.public_id;
					width = uploadData.width || null;
					height = uploadData.height || null;
				}

				// 3. Save media record in DB
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

				if (!saveRes.ok) throw new Error("Failed to save media in database");
				const saveJson = await saveRes.json();

				toast.success("Image uploaded successfully");
				return saveJson.media as UploadedMedia;
			} catch (err: unknown) {
				console.error("Upload error:", err);
				toast.error((err as Error).message || "Failed to upload image");
				return null;
			} finally {
				setUploading(false);
			}
		},
		[],
	);

	return { uploading, upload };
}
