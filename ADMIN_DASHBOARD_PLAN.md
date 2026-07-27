# Admin Dashboard Plan

This document describes how to give website administrators the power to create, edit, publish, unpublish, and delete website content. The app can be migrated to or rebuilt with Next.js so the frontend, admin dashboard, and backend API can live in one project and be hosted on Vercel.

## Goal

Build a secure admin dashboard where approved admins can manage website content without editing code.

Admins should be able to manage:

- Home page sections
- About page content
- Services or programs
- Blog/news posts
- Testimonials
- Gallery images
- Contact information
- Navigation/footer links
- SEO titles, descriptions, and preview images

Images and media files will be uploaded to Cloudinary. Structured website data will be stored in Neon Postgres.

## Recommended Stack

- Next.js for the website, admin dashboard, and backend routes
- React for UI components
- Vercel for hosting
- Neon Postgres for database storage
- Cloudinary for image storage and delivery
- Prisma or Drizzle ORM for database access
- NextAuth/Auth.js, Clerk, or a custom credentials login for one admin account
- Zod for validating admin form data

## Architecture

```text
Visitor
  -> Next.js website pages
  -> Reads published content from Neon
  -> Loads optimized media from Cloudinary

Admin
  -> /admin dashboard
  -> Logs in securely
  -> Creates/edits/deletes content
  -> Uploads images to Cloudinary
  -> Saves content records in Neon

Vercel
  -> Hosts frontend pages
  -> Runs API routes/server actions
  -> Stores environment variables

Neon
  -> Stores admin account, pages, posts, sections, and media records

Cloudinary
  -> Stores uploaded images
  -> Returns secure image URLs used by the website
```

## Admin Access

Use one admin dashboard that controls everything on the website.

There will be no separate dashboard types. Once the admin logs in, they can:

- Create content
- Edit content
- Publish and unpublish content
- Delete content
- Upload and manage images
- Update website settings

Every admin request must still verify that the user is logged in before changing content.

## Main Admin Features

### Dashboard Home

Show a quick overview:

- Total pages
- Published posts
- Draft posts
- Recent updates
- Recently uploaded images

### Page Manager

Admins can manage website pages such as Home, About, Contact, and Services.

Required actions:

- Create a page
- Edit page title, slug, content, and SEO fields
- Publish or unpublish a page
- Delete a page if allowed

### Content Sections

Some pages may need editable sections instead of one large text field.

Example sections:

- Hero section
- About summary
- Services list
- Call-to-action section
- Gallery section
- Testimonials section

Each section should support ordering so admins can control where content appears.

### Blog or News

Admins can create posts with:

- Title
- Slug
- Excerpt
- Body content
- Featured image
- Author
- Status: draft or published
- Publish date
- SEO fields

### Media Library

Admins can upload images to Cloudinary and reuse them across the site.

Store this data in Neon after upload:

- Cloudinary public ID
- Secure image URL
- Width and height
- Alt text
- Caption
- Uploaded by
- Created date

### Delete Behavior

Prefer soft delete for important content.

Instead of removing records immediately, store:

```text
deletedAt
deletedById
```

This makes it possible to recover content later and prevents accidental permanent data loss.

## Database Tables

Suggested Neon Postgres tables:

```text
users
  id
  name
  email
  passwordHash or authProviderId
  createdAt
  updatedAt

pages
  id
  title
  slug
  status
  seoTitle
  seoDescription
  seoImageId
  createdById
  updatedById
  publishedAt
  deletedAt
  createdAt
  updatedAt

page_sections
  id
  pageId
  type
  title
  content
  settings
  sortOrder
  status
  createdAt
  updatedAt

posts
  id
  title
  slug
  excerpt
  body
  featuredImageId
  status
  seoTitle
  seoDescription
  authorId
  publishedAt
  deletedAt
  createdAt
  updatedAt

media
  id
  cloudinaryPublicId
  secureUrl
  width
  height
  altText
  caption
  uploadedById
  createdAt
  updatedAt

audit_logs
  id
  userId
  action
  entityType
  entityId
  metadata
  createdAt
```

## Example Prisma Models

```prisma
enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]   @relation("PostAuthor")
  media     Media[]
}

model Page {
  id             String        @id @default(cuid())
  title          String
  slug           String        @unique
  status         ContentStatus @default(DRAFT)
  seoTitle       String?
  seoDescription String?
  seoImageId     String?
  publishedAt    DateTime?
  deletedAt      DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  sections       PageSection[]
}

model PageSection {
  id        String        @id @default(cuid())
  pageId    String
  type      String
  title     String?
  content   Json
  settings  Json?
  sortOrder Int           @default(0)
  status    ContentStatus @default(DRAFT)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  page      Page          @relation(fields: [pageId], references: [id], onDelete: Cascade)
}

model Post {
  id             String        @id @default(cuid())
  title          String
  slug           String        @unique
  excerpt        String?
  body           String
  featuredImageId String?
  status         ContentStatus @default(DRAFT)
  seoTitle       String?
  seoDescription String?
  authorId       String
  publishedAt    DateTime?
  deletedAt      DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  author         User          @relation("PostAuthor", fields: [authorId], references: [id])
}

model Media {
  id                 String   @id @default(cuid())
  cloudinaryPublicId String   @unique
  secureUrl          String
  width              Int?
  height             Int?
  altText            String?
  caption            String?
  uploadedById       String
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  uploadedBy         User     @relation(fields: [uploadedById], references: [id])
}
```

## Suggested Next.js Routes

```text
app/
  page.tsx
  about/page.tsx
  blog/page.tsx
  blog/[slug]/page.tsx

  admin/
    page.tsx
    login/page.tsx
    pages/page.tsx
    pages/new/page.tsx
    pages/[id]/edit/page.tsx
    posts/page.tsx
    posts/new/page.tsx
    posts/[id]/edit/page.tsx
    media/page.tsx
    settings/page.tsx

  api/
    admin/
      pages/route.ts
      pages/[id]/route.ts
      posts/route.ts
      posts/[id]/route.ts
      media/route.ts
      upload/signature/route.ts
```

## Cloudinary Upload Flow

Recommended secure upload flow:

1. Admin selects an image in the dashboard.
2. Frontend asks the backend for a signed Cloudinary upload signature.
3. Backend verifies the admin session.
4. Backend generates the Cloudinary signature using the Cloudinary API secret.
5. Frontend uploads the image directly to Cloudinary.
6. Cloudinary returns the image URL and public ID.
7. Frontend sends that result to the backend.
8. Backend saves the media record in Neon.

Do not expose the Cloudinary API secret in browser code.

## Environment Variables

Add these variables in local `.env` and in Vercel project settings:

```env
DATABASE_URL="postgresql://..."

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

AUTH_SECRET="your-secure-auth-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Only variables starting with `NEXT_PUBLIC_` should be available in the browser.

## Security Requirements

- Protect every `/admin` page.
- Protect every admin API route and server action.
- Validate all form input with Zod before saving.
- Confirm the user is logged in before create, update, publish, or delete actions.
- Never store Cloudinary secrets in frontend code.
- Use unique slugs for pages and posts.
- Keep audit logs for important changes.
- Use soft delete for pages, posts, and media where possible.

## Admin Workflow

```text
Admin logs in
  -> Opens dashboard
  -> Creates or edits content
  -> Uploads/selects Cloudinary images
  -> Saves as draft
  -> Previews page
  -> Publishes content
  -> Public website updates automatically
```

## Public Website Workflow

```text
User visits website
  -> Next.js loads page by slug
  -> Server fetches published content from Neon
  -> Page renders text and Cloudinary images
  -> Draft/deleted content stays hidden
```

## Implementation Steps

1. Migrate the current React app to Next.js or create a new Next.js app beside it.
2. Configure Neon and connect it with Prisma or Drizzle.
3. Create database models for users, pages, sections, posts, media, and audit logs.
4. Add authentication and admin route protection.
5. Build the `/admin` dashboard layout.
6. Add CRUD screens for pages and posts.
7. Add Cloudinary signed uploads.
8. Add media library selection and alt text editing.
9. Update public pages to read published content from Neon.
10. Deploy to Vercel and add production environment variables.

## Phase-by-Phase Roadmap

### Phase 1: Project Planning and Setup

Goal: Prepare the project foundation before building the dashboard.

Tasks:

- Review the existing React app structure.
- Decide whether to migrate the current app into Next.js or create a fresh Next.js version.
- Create the Next.js project structure.
- Set up TypeScript, Tailwind CSS, linting, and formatting.
- Set up the main layout for public pages and admin pages.
- Create environment variable files for local development.

Responsive requirements:

- Define global responsive breakpoints for mobile, tablet, laptop, and desktop.
- Confirm the public layout works at common widths: `360px`, `390px`, `768px`, `1024px`, and `1440px`.
- Avoid fixed-width containers that break on small screens.

Deliverable:

- A running Next.js app with the current website layout ready for migration or rebuild.

### Phase 2: Database Setup With Neon

Goal: Create the database foundation for editable website content.

Tasks:

- Create a Neon Postgres project.
- Add `DATABASE_URL` to local `.env` and Vercel environment variables.
- Install and configure Prisma or Drizzle.
- Create database tables for users, pages, page sections, posts, media, and audit logs.
- Run the first database migration.
- Add seed data for at least one admin user and basic website pages.

Responsive requirements:

- No major UI work is required in this phase.
- Keep future admin table layouts in mind by designing data that can be displayed in compact mobile views.

Deliverable:

- Neon database connected to the Next.js app with working migrations.

### Phase 3: Authentication and Admin Protection

Goal: Make sure only approved admins can access the dashboard.

Tasks:

- Choose an auth solution: Auth.js, Clerk, or custom credentials login.
- Build the `/admin/login` page.
- Add session handling.
- Protect all `/admin` routes.
- Protect all admin API routes or server actions.
- Redirect unauthenticated users to login.

Responsive requirements:

- Login page must work cleanly on mobile and desktop.
- Forms should be full-width on mobile and constrained on larger screens.
- Buttons and inputs should be easy to tap on touch devices.

Deliverable:

- Secure admin login and protected admin routes.

### Phase 4: Admin Dashboard Layout

Goal: Build the main admin interface that admins will use every day.

Tasks:

- Create `/admin` dashboard home.
- Add admin sidebar navigation for desktop.
- Add mobile navigation using a menu button or drawer.
- Add top bar with admin account, logout, and quick actions.
- Add dashboard summary cards for pages, posts, drafts, and media.
- Add empty states and loading states.

Responsive requirements:

- Desktop: sidebar navigation should stay visible.
- Tablet: sidebar can collapse or remain compact.
- Mobile: navigation should become a drawer or bottom-friendly menu.
- Tables should not overflow the screen; use stacked rows, horizontal scroll, or card-style mobile rows.
- Text and buttons must not overlap at small widths.

Deliverable:

- Responsive admin shell with navigation, dashboard home, and basic stats.

### Phase 5: Page and Section Management

Goal: Allow admins to control the main pages of the website.

Tasks:

- Build page list screen.
- Build create page screen.
- Build edit page screen.
- Add fields for title, slug, status, SEO title, SEO description, and SEO image.
- Add page sections such as hero, text block, services, testimonials, gallery, and call-to-action.
- Allow admins to reorder sections.
- Add draft, publish, unpublish, and soft delete actions.
- Validate all page data before saving.

Responsive requirements:

- Page editor should use a single column on mobile.
- On desktop, editor fields and preview/settings can use a two-column layout.
- Reordering controls must work on touch screens.
- Long content fields should remain usable on small screens.

Deliverable:

- Admins can create, edit, publish, unpublish, and delete website pages and page sections.

### Phase 6: Blog or News Management

Goal: Allow admins to manage posts or news updates.

Tasks:

- Build post list screen.
- Build create post screen.
- Build edit post screen.
- Add title, slug, excerpt, body, featured image, author, status, publish date, and SEO fields.
- Add draft and published states.
- Add preview before publishing.
- Add soft delete.

Responsive requirements:

- Post editor should be comfortable on mobile and desktop.
- Toolbar actions should wrap or collapse into a menu on small screens.
- Preview should stack below the editor on mobile.

Deliverable:

- Admins can manage blog/news content from the dashboard.

### Phase 7: Cloudinary Media Library

Goal: Allow admins to upload, manage, and reuse website images.

Tasks:

- Create Cloudinary account and upload preset/settings.
- Add Cloudinary environment variables.
- Build secure signed upload endpoint.
- Build media upload UI in the admin dashboard.
- Save Cloudinary image URL, public ID, width, height, alt text, and caption in Neon.
- Build media library grid.
- Allow admins to select images for pages, sections, posts, and SEO previews.
- Add image alt text editing for accessibility.

Responsive requirements:

- Media grid should adapt from 1 column on small screens to multiple columns on desktop.
- Upload buttons must be easy to tap on mobile.
- Image preview modals should fit inside small screens.
- Avoid large images causing layout shift.

Deliverable:

- Admins can upload images to Cloudinary and use them across the website.

### Phase 8: Public Website Content Integration

Goal: Connect the public website to the admin-managed content.

Tasks:

- Update public pages to fetch published content from Neon.
- Render page sections dynamically.
- Render Cloudinary images with correct alt text.
- Hide drafts, archived items, and soft-deleted records.
- Add loading and not-found states.
- Add metadata for SEO from database fields.
- Add cache/revalidation strategy so published changes appear quickly.

Responsive requirements:

- Every public page must be checked on mobile, tablet, and desktop.
- Images should use responsive sizing.
- Hero sections should avoid text/image overlap.
- Navigation and footer must remain usable on small screens.

Deliverable:

- Public website displays admin-managed content from Neon and Cloudinary.

### Phase 9: Audit Logs, Safety, and Polish

Goal: Make the admin system safer and easier to operate.

Tasks:

- Record admin actions in `audit_logs`.
- Add confirmation dialogs for delete/unpublish actions.
- Add success and error notifications.
- Add clear validation messages.
- Add search and filters for pages, posts, and media.
- Add pagination where lists can grow.
- Confirm sensitive actions require an active admin session.

Responsive requirements:

- Confirmation dialogs must fit mobile screens.
- Filters should stack on mobile and align horizontally on desktop.
- Admin lists should remain readable without horizontal page overflow.

Deliverable:

- Safer, polished dashboard with activity tracking and better admin usability.

### Phase 10: Testing and Responsive QA

Goal: Confirm the system works correctly before launch.

Tasks:

- Test login and logout.
- Test that only the logged-in admin can access the dashboard.
- Test creating, editing, publishing, unpublishing, and deleting pages.
- Test creating, editing, publishing, unpublishing, and deleting posts.
- Test Cloudinary upload and media selection.
- Test public website rendering.
- Test invalid form inputs.
- Test production-like environment variables.

Responsive checklist:

- Test at `360px` mobile width.
- Test at `390px` mobile width.
- Test at `768px` tablet width.
- Test at `1024px` laptop width.
- Test at `1440px` desktop width.
- Confirm no text overlaps.
- Confirm no buttons overflow.
- Confirm navigation works on touch screens.
- Confirm forms are readable and usable.
- Confirm image grids, tables, modals, and editors adapt correctly.

Deliverable:

- Dashboard and website verified across screen sizes.

### Phase 11: Vercel Deployment

Goal: Launch the full app online.

Tasks:

- Push the project to GitHub or another Git provider.
- Connect the repo to Vercel.
- Add all production environment variables in Vercel.
- Confirm Neon allows production database connections.
- Confirm Cloudinary production credentials work.
- Run the production build.
- Deploy to Vercel.
- Test the deployed admin dashboard and public website.

Responsive requirements:

- Run a final responsive check on the live Vercel URL.
- Test on at least one real mobile device if possible.

Deliverable:

- Live website and admin dashboard hosted on Vercel.

### Phase 12: Post-Launch Maintenance

Goal: Keep the dashboard reliable after launch.

Tasks:

- Monitor errors and failed uploads.
- Back up important database content.
- Review audit logs regularly.
- Add new content types as the website grows.
- Improve dashboard workflows based on admin feedback.
- Keep dependencies updated.

Responsive requirements:

- Recheck responsive behavior whenever new admin screens or public sections are added.

Deliverable:

- A maintainable admin system that can grow with the website.

## Definition of Done

The admin dashboard is complete when:

- Admins can log in securely.
- Admins can create, edit, publish, unpublish, and delete content.
- Admins can upload images to Cloudinary.
- Image metadata is saved in Neon.
- Public pages only show published content.
- Deleted content is hidden from the website.
- Admin actions are validated and protected by login.
- The full app can be deployed on Vercel.
