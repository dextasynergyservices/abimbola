import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
	display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
	subsets: ["latin"],
	variable: "--font-cormorant-garamond",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Abimbola Lawuyi",
	description: "A Lady with a Pen and a Purpose.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${dmSans.variable} ${cormorantGaramond.variable}`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
