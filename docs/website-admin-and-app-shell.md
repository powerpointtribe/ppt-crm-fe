# Website admin in the CRM, and the persistent app shell

This document covers two changes to the CRM frontend:

1. **Website admin.** The admin from the website project (`Power_Point_Tribe_Frontend`, at `/admin`) now runs inside the CRM, under `/website`. It is built with the CRM's own components and styles.
2. **Persistent app shell.** Pages no longer flash when you move between them. The sidebar is now drawn once and stays on screen; only the page content changes.

---

## 1. Website admin

### What it does

Staff can manage everything shown on the public website from the CRM. They no longer need a separate admin site.

The old admin talked to a small server in the website project (its BFF in `src/app/admin/_bff`). That server passed each request on to crm-be. The CRM now calls those same crm-be endpoints directly, using the logged-in user's token. It translates the data the same way the old server did. Nothing changed in crm-be.

### Where to find it

The sidebar has one **Website** dropdown. Opening it shows the old admin's categories as small headings, with their items underneath. Clicking **Website** itself opens the overview page.

| Category | Items | Route |
|---|---|---|
| Messages | Sermons, Series, Push Buttons, Events | `/website/sermons`, `/website/series`, `/website/devotionals`, `/website/events` |
| People & Pages | Pastors, Testimonies, Units, Tribe Groups, FAQs, Campuses | `/website/pastors`, `/website/testimonies`, `/website/units`, `/website/tribe-groups`, `/website/faqs`, `/website/campuses` |
| Shop & Giving | Products, Donations, Giving Accounts | `/website/products`, `/website/donations`, `/website/giving-accounts` |
| Care & Inbox | Form Submissions, Lost and Found, Claims | `/website/submissions`, `/website/lost-items`, `/website/claims` |
| Site | Site Settings | `/website/settings` |

The overview page (`/website`) shows counts of what needs attention: new form submissions, found items to review, claims to check, giving accounts awaiting approval, draft sermons, upcoming events and paid orders. It also links to every screen.

Staff who can post found items but not review them see a simpler overview instead. It lists the items they posted and has a button to post a new one. This matches the old admin's "workforce" view.

### Feature by feature

- **Content: sermons, series, Push Buttons, pastors, testimonies, units, tribe groups and FAQs.**
  - List screens have search and filters. The filters are kept in the URL, so they survive a reload and can be shared.
  - Items can be created, edited and deleted.
  - Visibility can be Draft, Published or Scheduled. Scheduled items take a publish date and time.
  - Images can be uploaded, with a description for screen readers.
- **Events, campuses and products.** These records are created in the CRM. Here staff edit only how each one appears on the website: whether it shows, venue, service times, featured, badge and so on. Fields owned by the CRM are shown but can't be edited.
- **Giving accounts.** These need a second person's approval. A new account is a draft until someone other than its author approves it. Proposed changes to an approved account also wait for approval, and the screen shows them.
- **Lost and found.** Found items go through review: waiting for review, listed, claim in progress, collected, moved to the Care Closet.
- **Claims.** Desk staff mark a claim as handed over or reject it.
- **Form submissions.** Each submission expands to show contact details and everything the visitor entered. Staff can change its status, assign it, keep staff-only notes and delete it.
- **Donations.** Totals per fund and a list of gifts for a date range (month to date by default), filterable by fund, plus a CSV export.
- **Site settings.** The service strip, listening and social links, the home page video and poster, the next David's Company cohort date, and contact inboxes.

### Permissions

Sidebar items, buttons and form fields appear only for users who hold the matching crm-be permissions. The rules are the same as the old admin's; see `PERMISSIONS` in `src/pages/Website/resources.ts`. crm-be still checks every request; the frontend only decides what to show.

### Files

| File | What it holds |
|---|---|
| `src/services/website-admin.ts` | All crm-be calls for the website admin. Ported from the old admin's server code (BFF). It translates field names (`campusId` ↔ `branch`, `_id` → `id`), images (`{ url, alt }` ↔ `photoUrl` / `photoAlt`) and the "scheduled" status (published + a future `publishAt`). It also turns crm-be validation messages into errors on the matching form fields. |
| `src/pages/Website/resources.ts` | Settings for each content type: its fields, list columns, filters and permissions. Copied from the old admin's `resources.ts`. |
| `src/pages/Website/shared.tsx` | Shared pieces: form inputs for each field type, image upload, the campus/series/pastor dropdown data, status badges, paging and formatters. |
| `src/pages/Website/ResourceList.tsx`, `ResourceEdit.tsx` | One list screen and one edit screen that serve every content type, driven by `resources.ts`. |
| `src/pages/Website/WebsiteOverview.tsx` | The `/website` overview page. |
| `src/pages/Website/Submissions.tsx`, `Claims.tsx`, `Donations.tsx`, `SiteSettings.tsx` | Screens that don't fit the generic list and edit pattern. |
| `src/App.tsx` | The `/website/*` routes. |
| `src/components/Sidebar.tsx` | The Website dropdown. Sub-items can now carry an optional `section`; a heading is drawn wherever the section changes. Existing dropdowns don't use it and look the same. |

**To add a new website content type:** add an entry to `RESOURCES` in `resources.ts` and to `DEFS` in `website-admin.ts`, then add a sidebar sub-item. The list and edit screens pick it up automatically.

### Not carried over

- **"My account" (change password).** The CRM's existing Account section (My Settings, change password) already covers it.
- **Choosing who to assign a submission to.** crm-be has no list of staff a submission can be assigned to, so the dropdown offers the signed-in user only. The old admin had the same limitation.

---

## 2. Persistent app shell (no flash between pages)

### The problem

There was a brief flash when moving between pages, for example from `/dashboard` to `/branches`. Measured in Chrome, it had three causes:

1. **Every page rebuilt the whole frame.** Each page wrapped itself in its own `<Layout>` (sidebar and header), so every navigation threw the sidebar away and built a new one.
2. **First visits blanked the screen.** The first time a page is opened, its code is loaded on demand. While it loaded, the whole screen, sidebar included, was replaced by a spinner: about 140 ms with no sidebar.
3. **Every page faded in from transparent.** The content started fully transparent and faded in over about 170 ms, even for pages already loaded.

### The fix

- **One shell for all signed-in pages** (`src/components/AppShell.tsx`). In `App.tsx`, all signed-in routes now sit under one parent route that renders the sidebar once. Pages still use `<Layout title=…>` as before. Inside the shell, `Layout` renders only the header and content, so no page files had to change.
- **No spinner while a page loads.** The router's `v7_startTransition` option is on (`src/main.tsx`), so the current page stays visible until the next one is ready. Inside the shell, `LazyPage` no longer adds its own loading screen. A spinner now appears only on a hard refresh, and only in the content area.
- **No fade.** Content appears at full opacity straight away.
- **Sidebar links are updated, not rebuilt.** The sidebar defined its menu item as a component inside its own render, so React saw a new component on every render. It recreated every link and replayed open dropdown animations on each navigation. The item is now called as a plain function, so the links stay in place.

### What stayed the same

- A page's content still starts fresh when its URL changes, for example going from one member to another. The content area is still keyed by the URL path.
- `/change-password` stays a full-screen page without the sidebar.
- Public pages (`/store`, the registration forms and so on) are unaffected.
- Logged-out users are still sent to `/login`.

### Results (Chrome, measured frame by frame)

| | Before | After |
|---|---|---|
| Sidebar on navigation | Rebuilt every time | Same element, kept on screen |
| Blank or transparent frames | ~140 ms with no sidebar, then a ~170 ms fade | None |
| Open dropdown on navigation | Replays its open animation | Stays as it is |

### Trade-off

On a slow connection, the first click to a page you haven't opened yet stays on the current page for a moment instead of showing a spinner. The sidebar already pre-loads a page's code when you hover its link, so in practice this is usually instant.

---

## Testing

The tests ran in Chrome against the local app (`localhost:5173`) and crm-be (`localhost:3001`), signed in as the super admin through the normal login form. Write tests checked the result in crm-be, used their own test records, deleted them afterwards, and restored any existing record they changed.

- **Website admin: 20 of 21 checks pass, on three runs in a row.**
  - The sidebar dropdown opens to show all 5 headings and 17 items, in order.
  - Overview counts match crm-be, and all 13 list screens load.
  - Create, edit, publish, schedule and delete work. crm-be validation errors appear on the right fields.
  - A giving account's author can't approve their own account: crm-be refuses and the message is shown.
  - Lost-item review, website fields on products, campuses and events, submission status and notes, claims, the donations CSV export, and site settings all work.
- **App shell: all 8 checks pass.** Logged-out redirect, public pages without the sidebar, a hard refresh on a lazily loaded page, switching items on the same page, `/change-password` without the sidebar, the mobile menu, and no page errors.
- **The one failure is image upload, because of local setup.** The local crm-be `.env` has a placeholder Cloudinary key, which Cloudinary rejects. The file reaches crm-be and passes its file-type check, so uploads should work once real Cloudinary keys are set.
- **No new type errors.** The project has 631 existing TypeScript errors; the count is the same with and without these changes.

## Known issues (existing before this work)

- The Campuses page (`/branches`) passes no title to `Layout`, so its header shows the default, "Dashboard".
- Several pages pass a `headerActions` prop that `Layout` doesn't accept. These make up 20 of the 631 existing type errors.
