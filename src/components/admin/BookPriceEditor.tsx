"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type BookPriceType = "HARD_COPY" | "SOFT_COPY" | "FREE" | "COMING_SOON";

export interface PriceFormRow {
	type: BookPriceType;
	enabled: boolean;
	amount: string;
	url: string;
}

export const PRICE_TYPE_LABELS: Record<BookPriceType, string> = {
	HARD_COPY: "Hard Copy",
	SOFT_COPY: "Soft Copy",
	FREE: "Free",
	COMING_SOON: "Coming Soon",
};

export const PRICE_TYPES: BookPriceType[] = [
	"HARD_COPY",
	"SOFT_COPY",
	"FREE",
	"COMING_SOON",
];

interface BookPriceEditorProps {
	rows: Record<BookPriceType, PriceFormRow>;
	onChange: (type: BookPriceType, patch: Partial<PriceFormRow>) => void;
}

export function BookPriceEditor({ rows, onChange }: BookPriceEditorProps) {
	return (
		<div className="space-y-3">
			{PRICE_TYPES.map((type) => {
				const row = rows[type];
				const needsAmount = type === "HARD_COPY" || type === "SOFT_COPY";
				return (
					<Card
						key={type}
						className={`p-4 border-slate-200 transition-colors ${
							row.enabled ? "bg-amber-50/40 border-amber-200" : "bg-slate-50"
						}`}
					>
						<div className="flex items-center justify-between">
							<Label
								htmlFor={`price-toggle-${type}`}
								className="text-slate-800 font-semibold cursor-pointer"
							>
								{PRICE_TYPE_LABELS[type]}
							</Label>
							<Switch
								id={`price-toggle-${type}`}
								checked={row.enabled}
								onCheckedChange={(checked) =>
									onChange(type, { enabled: checked })
								}
							/>
						</div>

						{row.enabled && (
							<div className="mt-3 space-y-3">
								{needsAmount && (
									<div>
										<Label
											htmlFor={`price-amount-${type}`}
											className="text-xs text-slate-500 font-medium"
										>
											Amount (₦)
										</Label>
										<Input
											id={`price-amount-${type}`}
											type="number"
											min={0}
											value={row.amount}
											onChange={(e) =>
												onChange(type, { amount: e.target.value })
											}
											placeholder="e.g. 15000"
											className="mt-1 bg-white border-slate-200 min-h-[40px]"
										/>
									</div>
								)}
								<div>
									<Label
										htmlFor={`price-url-${type}`}
										className="text-xs text-slate-500 font-medium"
									>
										{type === "COMING_SOON"
											? "Pre-Order Link (URL)"
											: type === "FREE"
												? "Download / Access Link (URL)"
												: "Purchase / Order Link (URL)"}
									</Label>
									<Input
										id={`price-url-${type}`}
										type="url"
										value={row.url}
										onChange={(e) => onChange(type, { url: e.target.value })}
										placeholder={
											type === "COMING_SOON"
												? "https://paystack.com/... or https://selar.co/... (Leave empty if no pre-order link)"
												: type === "FREE"
													? "https://drive.google.com/... or https://..."
													: "https://paystack.com/... or https://selar.co/..."
										}
										className="mt-1 bg-white border-slate-200 min-h-[40px]"
									/>
								</div>
							</div>
						)}
					</Card>
				);
			})}
		</div>
	);
}

export function createDefaultPriceRows(): Record<BookPriceType, PriceFormRow> {
	return {
		HARD_COPY: { type: "HARD_COPY", enabled: false, amount: "", url: "" },
		SOFT_COPY: { type: "SOFT_COPY", enabled: false, amount: "", url: "" },
		FREE: { type: "FREE", enabled: false, amount: "", url: "" },
		COMING_SOON: { type: "COMING_SOON", enabled: false, amount: "", url: "" },
	};
}
