import crypto from "node:crypto";

export interface CloudinarySignatureResponse {
	timestamp: number;
	signature: string;
	apiKey: string;
	cloudName: string;
	folder?: string;
	isMock?: boolean;
}

/**
 * Generate a SHA-1 Cloudinary signature for direct signed client uploads.
 * If credentials are not configured or placeholder values are present, returns a flag indicating mock mode.
 */
export function generateCloudinarySignature(
	paramsToSign: Record<string, string | number> = {},
): CloudinarySignatureResponse {
	const cloudName =
		process.env.CLOUDINARY_CLOUD_NAME ||
		process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
		"";
	const apiKey = process.env.CLOUDINARY_API_KEY || "";
	const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

	const timestamp = Math.floor(Date.now() / 1000);
	const params = {
		timestamp,
		...paramsToSign,
	};

	// Check if keys are placeholders or unconfigured
	const isMock =
		!cloudName ||
		!apiKey ||
		!apiSecret ||
		cloudName === "your-cloud-name" ||
		apiKey === "your-api-key" ||
		apiSecret === "your-api-secret";

	if (isMock) {
		return {
			timestamp,
			signature: "mock_signature",
			apiKey: apiKey || "mock_api_key",
			cloudName: cloudName || "mock_cloud_name",
			folder: paramsToSign.folder ? String(paramsToSign.folder) : undefined,
			isMock: true,
		};
	}

	// Sort parameters alphabetically
	const sortedKeys = Object.keys(params).sort();
	const stringToSign =
		sortedKeys.map((key) => `${key}=${params[key]}`).join("&") + apiSecret;

	const signature = crypto
		.createHash("sha1")
		.update(stringToSign)
		.digest("hex");

	return {
		timestamp,
		signature,
		apiKey,
		cloudName,
		folder: paramsToSign.folder ? String(paramsToSign.folder) : undefined,
		isMock: false,
	};
}
