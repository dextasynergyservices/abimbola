export const books = [
	{
		id: 1,
		title: "The hardest part of loving your child",
		author: "Abimola Lawuyi",
		price: "₦15,000",
		rating: 4.5,
		image: "/assets/For%20BOOKS%20(1).png",
		category: "FAMILY & PARENTING",
		description:
			"A profound exploration into the emotional complexities of parenthood. This book delves deep into the often unspoken challenges and profound sacrifices that come with loving your children unconditionally.",
		publisher: "Abimbola Lawuyi Publishing",
		publicationDate: "2025",
	},
	{
		id: 2,
		title: "50 Life Lessons",
		author: "Abimola Lawuyi",
		price: "Coming Soon",
		rating: 5.0,
		image:
			"https://res.cloudinary.com/dxoorukfj/image/upload/v1784550650/50_50_Abimbola_tuaugi.png",
		category: "LIFE & WISDOM",
		description:
			"A curated collection of invaluable wisdom and reflections. This book offers 50 powerful life lessons designed to guide, inspire, and transform your everyday perspective.",
		publisher: "Abimbola Lawuyi Publishing",
		publicationDate: "2023",
	},
	{
		id: 3,
		title: "Dear Single",
		author: "Abimola Lawuyi",
		price: "Coming Soon",
		rating: 4.8,
		image:
			"https://res.cloudinary.com/dxoorukfj/image/upload/v1782469054/DS_NEW_niyokf.png",
		category: "RELATIONSHIP & LOVE",
		description:
			"An empowering manifesto for the unattached. Navigate the journey of singleness with grace, purpose, and self-discovery as you prepare for whatever the future holds.",
		publisher: "Abimbola Lawuyi Publishing",
		publicationDate: "2026",
	},
];

export type Book = (typeof books)[number];
