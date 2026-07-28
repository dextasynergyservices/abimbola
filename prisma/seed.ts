import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const ContentStatus = {
	DRAFT: "DRAFT",
	PUBLISHED: "PUBLISHED",
	ARCHIVED: "ARCHIVED",
} as const;

async function main() {
	console.log(
		"Migrating and seeding all website content into Neon Postgres database...",
	);

	const defaultPasswordHash = await bcrypt.hash("AdminSecret123!", 10);

	// 1. Seed Admin User
	const admin = await prisma.user.upsert({
		where: { email: "admin@abimbolalawuyi.com" },
		update: {
			name: "Abimbola Lawuyi",
			passwordHash: defaultPasswordHash,
		},
		create: {
			name: "Abimbola Lawuyi",
			email: "admin@abimbolalawuyi.com",
			passwordHash: defaultPasswordHash,
		},
	});

	console.log(`✓ Admin user ready: ${admin.email} (${admin.id})`);

	// 2. Seed All Pages & Section Content
	const pagesData = [
		{
			title: "Home",
			slug: "/",
			status: ContentStatus.PUBLISHED,
			seoTitle: "Abimbola Lawuyi | Author, Coach & Educational Leader",
			seoDescription:
				"Official website of Abimbola Lawuyi - Inspiring growth, educational leadership, and transformation.",
			publishedAt: new Date(),
			sections: [
				{
					type: "hero",
					title: "Empowering Growth & Leadership",
					sortOrder: 1,
					status: ContentStatus.PUBLISHED,
					content: {
						subtitle: "Author, Coach & Educational Leader",
						headline: "Empowering Growth & Educational Leadership",
						description:
							"Dedicated to shaping minds, nurturing leaders, and providing transformative guidance across education, literature, and personal development.",
						ctaText: "Explore Books",
						ctaLink: "/books",
						image:
							"https://res.cloudinary.com/dxoorukfj/image/upload/v1784550650/50_50_Abimbola_tuaugi.png",
					},
				},
				{
					type: "about_summary",
					title: "About Abimbola Lawuyi",
					sortOrder: 2,
					status: ContentStatus.PUBLISHED,
					content: {
						heading: "Passionate Educationalist, Author & Mentor",
						description:
							"Abimbola Lawuyi is an accomplished educational leader, author, and coach dedicated to raising leaders, transforming school systems, and inspiring families through literature and mentorship.",
						body: "With years of executive experience in school leadership, teacher training, and personal development, Abimbola brings a wealth of practical wisdom and spiritual insight to every initiative.",
					},
				},
				{
					type: "services",
					title: "Programs & Keynote Services",
					sortOrder: 3,
					status: ContentStatus.PUBLISHED,
					content: {
						description:
							"Tailored guidance designed for educational leaders, teachers, parents, and seekers of personal growth.",
						items: [
							{
								title: "Educational Leadership & School Coaching",
								description:
									"Strategic coaching and workshops for school proprietors, administrators, and educators to elevate institutional excellence.",
							},
							{
								title: "Author & Literary Publishing",
								description:
									"Inspiring books focused on parenting, relationships, wisdom, and spiritual empowerment for individuals and families.",
							},
							{
								title: "Keynote Speaking & Mentorship",
								description:
									"Engaging keynote addresses and targeted mentorship programs on mindset, leadership, purpose, and youth empowerment.",
							},
						],
					},
				},
				{
					type: "testimonials",
					title: "Words of Appreciation",
					sortOrder: 4,
					status: ContentStatus.PUBLISHED,
					content: {
						items: [
							{
								quote:
									"Abimbola's leadership coaching transformed our school culture and empowered our educators to achieve incredible results.",
								author: "Dr. Sarah Jenkins",
								role: "School Director & Educator",
							},
							{
								quote:
									"Her book 'The Hardest Part of Loving Your Child' provided the exact clarity and peace our family needed.",
								author: "Michael Lawson",
								role: "Parent & Reader",
							},
							{
								quote:
									"An extraordinary mentor whose insights on leadership and personal development leave a lasting impact.",
								author: "Grace Adebayo",
								role: "Educational Administrator",
							},
						],
					},
				},
				{
					type: "cta",
					title: "Ready to Transform Your Journey?",
					sortOrder: 5,
					status: ContentStatus.PUBLISHED,
					content: {
						description:
							"Get in touch today to explore leadership programs, books, and coaching sessions.",
						buttonText: "Get in Touch",
						link: "/contact",
					},
				},
			],
		},
		{
			title: "About",
			slug: "about",
			status: ContentStatus.PUBLISHED,
			seoTitle: "About - Abimbola Lawuyi",
			seoDescription:
				"Learn more about Abimbola Lawuyi's journey, mission, educational leadership, and published works.",
			publishedAt: new Date(),
			sections: [
				{
					type: "bio",
					title: "My Story & Mission",
					sortOrder: 1,
					status: ContentStatus.PUBLISHED,
					content: {
						heading:
							"Dedicated to Inspiring Educational Excellence & Purposeful Living",
						body: "Abimbola Lawuyi is a passionate educationalist, author, and mentor. Over the course of her career, she has committed her life to mentoring leaders, training educators, and guiding families toward purpose-driven living.\n\nThrough her books, workshops, and speaking engagements, she continues to equip the next generation of leaders with the tools required for sustainable growth and personal transformation.",
						image:
							"https://res.cloudinary.com/dxoorukfj/image/upload/v1784550650/50_50_Abimbola_tuaugi.png",
						imageAlt: "Abimbola Lawuyi Portrait",
					},
				},
				{
					type: "services",
					title: "Core Areas of Impact",
					sortOrder: 2,
					status: ContentStatus.PUBLISHED,
					content: {
						description:
							"Empowering individuals and institutions across three core pillars.",
						items: [
							{
								title: "School System Transformation",
								description:
									"Advising school boards and leadership teams on curriculum, staff development, and operational excellence.",
							},
							{
								title: "Parenting & Family Mentorship",
								description:
									"Guiding parents through the emotional and developmental challenges of child-rearing.",
							},
							{
								title: "Inspirational Books & Publications",
								description:
									"Writing and distributing literature that inspires personal growth, faith, and wisdom.",
							},
						],
					},
				},
				{
					type: "testimonials",
					title: "Testimonials & Impact",
					sortOrder: 3,
					status: ContentStatus.PUBLISHED,
					content: {
						items: [
							{
								quote:
									"Abimbola speaks with rare wisdom and clarity. Her mentorship was a turning point for our organization.",
								author: "David Ogunlesi",
								role: "Community Leader",
							},
						],
					},
				},
			],
		},
		{
			title: "Books",
			slug: "books",
			status: ContentStatus.PUBLISHED,
			seoTitle: "Books & Literature - Abimbola Lawuyi",
			seoDescription:
				"Discover transformative books written by Abimbola Lawuyi covering parenting, wisdom, relationships, and growth.",
			publishedAt: new Date(),
			sections: [
				{
					type: "books_grid",
					title: "Published Works & Upcoming Releases",
					sortOrder: 1,
					status: ContentStatus.PUBLISHED,
					content: {
						description:
							"Explore literature written to guide parents, leaders, and individuals toward purposeful living.",
						books: [
							{
								id: 1,
								title: "The Hardest Part of Loving Your Child",
								author: "Abimbola Lawuyi",
								price: "₦15,000",
								rating: 4.8,
								category: "FAMILY & PARENTING",
								image: "/assets/For%20BOOKS%20(1).png",
								description:
									"A profound exploration into the emotional complexities of parenthood. This book delves deep into the often unspoken challenges and sacrifices that come with loving your children unconditionally.",
								publicationDate: "2025",
							},
							{
								id: 2,
								title: "50 Life Lessons for Modern Leaders",
								author: "Abimbola Lawuyi",
								price: "Coming Soon",
								rating: 5.0,
								category: "LIFE & WISDOM",
								image:
									"https://res.cloudinary.com/dxoorukfj/image/upload/v1784550650/50_50_Abimbola_tuaugi.png",
								description:
									"A curated collection of invaluable wisdom and reflections. Offers 50 powerful life lessons designed to guide, inspire, and transform everyday perspective.",
								publicationDate: "2025",
							},
							{
								id: 3,
								title: "Dear Single: A Journey of Purpose",
								author: "Abimbola Lawuyi",
								price: "Coming Soon",
								rating: 4.9,
								category: "RELATIONSHIP & LOVE",
								image:
									"https://res.cloudinary.com/dxoorukfj/image/upload/v1782469054/DS_NEW_niyokf.png",
								description:
									"An empowering manifesto for the unattached. Navigate the journey of singleness with grace, purpose, and self-discovery as you prepare for the future.",
								publicationDate: "2026",
							},
						],
					},
				},
			],
		},
		{
			title: "Blog",
			slug: "blog",
			status: ContentStatus.PUBLISHED,
			seoTitle: "Blog & Insights - Abimbola Lawuyi",
			seoDescription:
				"Read articles, essays, and reflections on leadership, education, parenting, and personal growth by Abimbola Lawuyi.",
			publishedAt: new Date(),
			sections: [
				{
					type: "blog_list",
					title: "Latest Reflections & Insights",
					sortOrder: 1,
					status: ContentStatus.PUBLISHED,
					content: {
						description:
							"Explore articles and reflections on education, parenting, literature, and purposeful leadership.",
					},
				},
			],
		},
		{
			title: "Contact",
			slug: "contact",
			status: ContentStatus.PUBLISHED,
			seoTitle: "Contact - Abimbola Lawuyi",
			seoDescription:
				"Get in touch with Abimbola Lawuyi for speaking engagements, school coaching, book inquiries, or mentorship.",
			publishedAt: new Date(),
			sections: [
				{
					type: "contact_form",
					title: "Connect & Inquire",
					sortOrder: 1,
					status: ContentStatus.PUBLISHED,
					content: {
						email: "contact@abimbolalawuyi.com",
						phone: "+234 800 000 0000",
						location: "Lagos, Nigeria",
						description:
							"Fill out the form below to reach out regarding keynote speaking, school coaching, or literary inquiries.",
					},
				},
			],
		},
	];

	for (const pageInfo of pagesData) {
		const { sections, ...pageFields } = pageInfo;
		const existingPage = await prisma.page.findUnique({
			where: { slug: pageFields.slug },
		});

		if (existingPage) {
			await prisma.page.update({
				where: { slug: pageFields.slug },
				data: {
					title: pageFields.title,
					status: pageFields.status,
					seoTitle: pageFields.seoTitle,
					seoDescription: pageFields.seoDescription,
					publishedAt: pageFields.publishedAt,
				},
			});

			// Re-create page sections
			await prisma.pageSection.deleteMany({
				where: { pageId: existingPage.id },
			});

			for (const sec of sections) {
				await prisma.pageSection.create({
					data: {
						pageId: existingPage.id,
						type: sec.type,
						title: sec.title,
						sortOrder: sec.sortOrder,
						status: sec.status,
						content: sec.content,
					},
				});
			}
			console.log(
				`✓ Updated page and sections for: ${existingPage.title} (${existingPage.slug})`,
			);
		} else {
			const newPage = await prisma.page.create({
				data: {
					...pageFields,
					sections: {
						create: sections,
					},
				},
			});
			console.log(`✓ Created page: ${newPage.title} (${newPage.slug})`);
		}
	}

	// 3. Seed Posts Data
	const postsData = [
		{
			title: "The Art of Mindful Reading in a Distracted World",
			slug: "the-art-of-mindful-reading",
			excerpt:
				"Discover how to transform your reading habits into a contemplative practice that enriches your mind and soul.",
			body: "Reading is more than decoding words; it is an active dialog between reader and author. In our fast-paced, notification-driven era, mindful reading creates a sanctuary of focus and quiet reflection...",
			status: ContentStatus.PUBLISHED,
			seoTitle: "The Art of Mindful Reading - Abimbola Lawuyi",
			seoDescription:
				"Transform reading into a reflective practice for deep focus.",
			publishedAt: new Date(),
		},
		{
			title: "Whispers in the Garden: Growth Through Seasons",
			slug: "whispers-in-the-garden",
			excerpt:
				"Reflections and prose exploring personal growth, patience, and embracing quiet moments between seasons.",
			body: "Growth happens quietly, often unseen beneath the surface long before fruit appears. Just as gardens rest through winter, our lives require seasons of reflection before new breakthroughs emerge...",
			status: ContentStatus.PUBLISHED,
			seoTitle: "Whispers in the Garden - Abimbola Lawuyi",
			seoDescription:
				"Reflections on growth, patience, and personal transformation.",
			publishedAt: new Date(),
		},
		{
			title: "The Last Letter from the Village: Lessons in Resilience",
			slug: "the-last-letter-from-the-village",
			excerpt:
				"An evocative story about uncovering ancestral letters filled with courage, faith, and enduring hope.",
			body: "Uncovering old letters preserved across generations reminds us of the strength and values that anchored those who came before us. Resilience is built when we honor our heritage while courageously building the future...",
			status: ContentStatus.PUBLISHED,
			seoTitle: "Lessons in Resilience - Abimbola Lawuyi",
			seoDescription: "A story of courage, family legacy, and enduring values.",
			publishedAt: new Date(),
		},
		{
			title: "Creating a Sanctuary of Quiet Reflection at Home",
			slug: "creating-a-space-for-quiet-reflection",
			excerpt:
				"Practical ways to design a quiet, peaceful corner in your home for reading, prayer, and deep thought.",
			body: "Your home environment deeply impacts your internal state. Creating a dedicated space—free from digital clutter—invites peace, creativity, and spiritual clarity into your daily routine...",
			status: ContentStatus.PUBLISHED,
			seoTitle: "Creating a Sanctuary at Home - Abimbola Lawuyi",
			seoDescription:
				"Design a sanctuary for quiet reflection and peace at home.",
			publishedAt: new Date(),
		},
		{
			title: "50 Life Lessons for Modern Educational Leaders",
			slug: "50-life-lessons-for-modern-leaders",
			excerpt:
				"Key principles for school proprietors and administrators navigating leadership, vision, and staff development.",
			body: "Educational leadership demands vision, empathy, and resilience. Leading a school is not just managing operations; it is nurturing an ecosystem where students and teachers thrive together...",
			status: ContentStatus.PUBLISHED,
			seoTitle: "50 Life Lessons for Educational Leaders - Abimbola Lawuyi",
			seoDescription:
				"Leadership principles for school owners, directors, and educators.",
			publishedAt: new Date(),
		},
	];

	for (const postInfo of postsData) {
		const existingPost = await prisma.post.findFirst({
			where: { slug: postInfo.slug },
		});

		if (existingPost) {
			await prisma.post.update({
				where: { id: existingPost.id },
				data: {
					title: postInfo.title,
					excerpt: postInfo.excerpt,
					body: postInfo.body,
					status: postInfo.status,
					seoTitle: postInfo.seoTitle,
					seoDescription: postInfo.seoDescription,
					publishedAt: postInfo.publishedAt,
				},
			});
			console.log(`✓ Updated post: ${existingPost.title}`);
		} else {
			const newPost = await prisma.post.create({
				data: {
					...postInfo,
					authorId: admin.id,
				},
			});
			console.log(`✓ Created post: ${newPost.title}`);
		}
	}

	// 4. Seed Blog Categories
	const blogCategoryNames = ["Articles", "Reflections", "Poems", "Stories"];
	const blogCategoryMap = new Map<string, string>();
	for (let i = 0; i < blogCategoryNames.length; i++) {
		const name = blogCategoryNames[i];
		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		const category = await prisma.blogCategory.upsert({
			where: { name },
			update: { sortOrder: i },
			create: { name, slug, sortOrder: i },
		});
		blogCategoryMap.set(name, category.id);
		console.log(`✓ Blog category ready: ${category.name}`);
	}

	// 5. Seed Book Categories
	const bookCategoryNames = [
		"FAMILY & PARENTING",
		"LIFE & WISDOM",
		"RELATIONSHIP & LOVE",
	];
	const bookCategoryMap = new Map<string, string>();
	for (let i = 0; i < bookCategoryNames.length; i++) {
		const name = bookCategoryNames[i];
		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		const category = await prisma.bookCategory.upsert({
			where: { name },
			update: { sortOrder: i },
			create: { name, slug, sortOrder: i },
		});
		bookCategoryMap.set(name, category.id);
		console.log(`✓ Book category ready: ${category.name}`);
	}

	// 6. Seed Media records for existing static book cover images
	const bookMediaData = [
		{
			cloudinaryPublicId: "static_hardest_part_loving_child",
			secureUrl: "/assets/For%20BOOKS%20(1).png",
			altText: "The hardest part of loving your child",
		},
		{
			cloudinaryPublicId: "50_50_abimbola_tuaugi",
			secureUrl:
				"https://res.cloudinary.com/dxoorukfj/image/upload/v1784550650/50_50_Abimbola_tuaugi.png",
			altText: "50 Life Lessons",
		},
		{
			cloudinaryPublicId: "ds_new_niyokf",
			secureUrl:
				"https://res.cloudinary.com/dxoorukfj/image/upload/v1782469054/DS_NEW_niyokf.png",
			altText: "Dear Single",
		},
	];

	const bookMediaMap = new Map<string, string>();
	for (const mediaInfo of bookMediaData) {
		const media = await prisma.media.upsert({
			where: { cloudinaryPublicId: mediaInfo.cloudinaryPublicId },
			update: { secureUrl: mediaInfo.secureUrl, altText: mediaInfo.altText },
			create: {
				cloudinaryPublicId: mediaInfo.cloudinaryPublicId,
				secureUrl: mediaInfo.secureUrl,
				altText: mediaInfo.altText,
				uploadedById: admin.id,
			},
		});
		bookMediaMap.set(mediaInfo.cloudinaryPublicId, media.id);
	}
	console.log("✓ Book cover images seeded into Media library");

	// 7. Seed Books
	const booksData = [
		{
			title: "The Hardest Part of Loving Your Child",
			slug: "the-hardest-part-of-loving-your-child",
			description:
				"A profound exploration into the emotional complexities of parenthood. This book delves deep into the often unspoken challenges and profound sacrifices that come with loving your children unconditionally.",
			rating: 4.5,
			publisher: "Abimbola Lawuyi Publishing",
			publicationDate: "2025",
			category: "FAMILY & PARENTING",
			coverMediaKey: "static_hardest_part_loving_child",
			prices: [{ type: "HARD_COPY", amount: 15000, available: true }],
		},
		{
			title: "50 Life Lessons",
			slug: "50-life-lessons",
			description:
				"A curated collection of invaluable wisdom and reflections. This book offers 50 powerful life lessons designed to guide, inspire, and transform your everyday perspective.",
			rating: 5.0,
			publisher: "Abimbola Lawuyi Publishing",
			publicationDate: "2023",
			category: "LIFE & WISDOM",
			coverMediaKey: "50_50_abimbola_tuaugi",
			prices: [{ type: "COMING_SOON", amount: null, available: true }],
		},
		{
			title: "Dear Single",
			slug: "dear-single",
			description:
				"An empowering manifesto for the unattached. Navigate the journey of singleness with grace, purpose, and self-discovery as you prepare for whatever the future holds.",
			rating: 4.8,
			publisher: "Abimbola Lawuyi Publishing",
			publicationDate: "2026",
			category: "RELATIONSHIP & LOVE",
			coverMediaKey: "ds_new_niyokf",
			prices: [{ type: "COMING_SOON", amount: null, available: true }],
		},
	];

	for (const bookInfo of booksData) {
		const { prices, category, coverMediaKey, ...bookFields } = bookInfo;
		const categoryId = bookCategoryMap.get(category) || null;
		const coverImageId = bookMediaMap.get(coverMediaKey) || null;

		const existingBook = await prisma.book.findUnique({
			where: { slug: bookFields.slug },
		});

		const book = existingBook
			? await prisma.book.update({
					where: { id: existingBook.id },
					data: {
						...bookFields,
						categoryId,
						coverImageId,
						status: ContentStatus.PUBLISHED,
					},
				})
			: await prisma.book.create({
					data: {
						...bookFields,
						categoryId,
						coverImageId,
						status: ContentStatus.PUBLISHED,
					},
				});

		for (const priceInfo of prices) {
			await prisma.bookPrice.upsert({
				where: {
					bookId_type: {
						bookId: book.id,
						type: priceInfo.type as
							| "HARD_COPY"
							| "SOFT_COPY"
							| "FREE"
							| "COMING_SOON",
					},
				},
				update: { amount: priceInfo.amount, available: priceInfo.available },
				create: {
					bookId: book.id,
					type: priceInfo.type as
						| "HARD_COPY"
						| "SOFT_COPY"
						| "FREE"
						| "COMING_SOON",
					amount: priceInfo.amount,
					available: priceInfo.available,
				},
			});
		}

		console.log(`✓ Book ready: ${book.title}`);
	}

	// 8. Seed default Site Settings singleton
	await prisma.siteSettings.upsert({
		where: { id: "singleton" },
		update: {},
		create: {
			id: "singleton",
			contactEmail: "hello@abimbolalawuyi.com",
			contactPhone: "+234 012 345 6789",
			address: "Lagos, Nigeria",
			instagramUrl: "https://instagram.com/abimbolawrites",
			facebookUrl:
				"https://www.facebook.com/people/AbimbolaWrites/61567294645489/",
		},
	});
	console.log("✓ Default site settings ready");

	console.log(
		"🎉 Database content migration and seeding completed successfully.",
	);
}

main()
	.catch((e) => {
		console.error("Seeding error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
