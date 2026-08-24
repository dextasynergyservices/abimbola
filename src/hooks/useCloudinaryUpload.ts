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

export type UploadStage =
	| "idle"
	| "signing"
	| "uploading"
	| "saving"
	| "complete"
	| "error";

/**
 * Hook that handles direct Cloudinary upload with real-time progress + saving to the media DB.
 * Returns the saved MediaItem so consumers can immediately use it.
 */
export function useCloudinaryUpload() {
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [stage, setStage] = useState<UploadStage>("idle");

	const upload = useCallback(
		async (files: FileList | null): Promise<UploadedMedia | null> => {
			if (!files || files.length === 0) return null;
			setUploading(true);
			setProgress(0);
			setStage("signing");

			try {
				const file = files[0];
				if (!file.type.startsWith("image/")) {
					toast.error("Selected file is not an image");
					setStage("error");
					return null;
				}

				// 1. Get Cloudinary signature
				const sigRes = await fetch("/api/admin/upload/signature", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ folder: "abimbola_uploads" }),
				});

				if (!sigRes.ok) {
					const sigError = await sigRes.json().catch(() => ({}));
					throw new Error(sigError?.error || "Failed to get upload signature");
				}
				const sigData = await sigRes.json();

				let secureUrl = "";
				let cloudinaryPublicId = "";
				let width: number | null = null;
				let height: number | null = null;

				if (sigData.isMock) {
					setStage("uploading");
					setProgress(30);

					// Dev / mock mode – read as base64
					const base64 = await new Promise<string>((resolve) => {
						const reader = new FileReader();
						reader.onloadend = () => resolve(reader.result as string);
						reader.readAsDataURL(file);
					});

					setProgress(70);

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
					setProgress(90);
				} else {
					// 2. Upload to Cloudinary using XMLHttpRequest for progress tracking
					setStage("uploading");
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
								setProgress(percent);
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

				// 3. Save media record in DB
				setStage("saving");
				setProgress(95);

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
					const saveError = await saveRes.json().catch(() => ({}));
					throw new Error(
						saveError?.error || "Failed to save media in database",
					);
				}
				const saveJson = await saveRes.json();

				setProgress(100);
				setStage("complete");
				toast.success("Image uploaded successfully!");
				return saveJson.media as UploadedMedia;
			} catch (err: unknown) {
				console.error("Upload error:", err);
				setStage("error");
				toast.error((err as Error).message || "Failed to upload image");
				return null;
			} finally {
				setUploading(false);
			}
		},
		[],
	);

	return { uploading, progress, stage, upload };
}
