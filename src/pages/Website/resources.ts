/**
 * Website admin screens, ported from the website's own admin
 * (Power_Point_Tribe_Frontend/src/app/admin/_lib/resources.ts).
 * `key` is the URL segment under /website and the resource key in services/website-admin.ts;
 * `policy` the permission row in PERMISSIONS below.
 */
export type LookupKey = "campuses" | "series" | "pastors";

/** `readOnly`: shown but never sent (fields managed in the CRM). */
export type FieldDef = (
  | { name: string; label: string; type: "text" | "textarea" | "url" | "email"; required?: boolean; help?: string; max?: number; placeholder?: string }
  | { name: string; label: string; type: "number"; required?: boolean; help?: string; min?: number; max?: number }
  | { name: string; label: string; type: "money"; required?: boolean; help?: string }
  | { name: string; label: string; type: "date" | "datetime"; required?: boolean; help?: string }
  | { name: string; label: string; type: "select"; options: readonly (readonly [string, string])[]; required?: boolean; nullable?: string; help?: string }
  | { name: string; label: string; type: "ref"; lookup: LookupKey; nullable?: string; required?: boolean; help?: string; filter?: (o: { kind?: string }) => boolean }
  | { name: string; label: string; type: "bool"; help?: string }
  | { name: string; label: string; type: "image"; help?: string; ratio?: string }
  | { name: string; label: string; type: "images"; help?: string }
  | { name: string; label: string; type: "tags"; help?: string }
  | { name: string; label: string; type: "times"; help?: string }
) & { readOnly?: boolean };

export type Column = { key: string; label: string; kind?: "date" | "datetime" | "money" | "status" | "bool" | "ref" | "image"; lookup?: LookupKey };

export type ResourceConfig = {
  key: string;
  policy: string;
  label: string;
  singular: string;
  group: string;
  fields: FieldDef[];
  columns: Column[];
  /** Has draft / published / scheduled. */
  publishable?: boolean;
  /** Lost items: review status instead of publishing. */
  reviewStatus?: readonly (readonly [string, string])[];
  filters?: { name: string; label: string; options?: readonly (readonly [string, string])[]; lookup?: LookupKey }[];
  /** Turn the changed values into the API body; `all` = every form value (nested objects are sent whole). */
  toBody?: (changed: Record<string, unknown>, all: Record<string, unknown>) => Record<string, unknown>;
  /** Show a field only when this returns true for current form values. */
  visible?: Record<string, (v: Record<string, unknown>) => boolean>;
  intro?: string;
};

const SERVICES = [["sunday", "Sunday service"], ["bible_study", "Bible Study"], ["special", "Special service"]] as const;
const STATUS_COL: Column = { key: "status", label: "Status", kind: "status" };
const PUBLISH_FILTER = { name: "status", label: "Status", options: [["draft", "Draft"], ["published", "Published"], ["scheduled", "Scheduled"]] as const };
const CAMPUS_FILTER = { name: "campusId", label: "Campus", lookup: "campuses" as const };
const campus = (nullable = "All campuses"): FieldDef => ({ name: "campusId", label: "Campus", type: "ref", lookup: "campuses", nullable });
const order: FieldDef = { name: "order", label: "Order", type: "number", min: 0, help: "Lower numbers show first." };

export const RESOURCES: ResourceConfig[] = [
  {
    key: "sermons", policy: "sermons", label: "Sermons", singular: "sermon", group: "Messages", publishable: true,
    intro: "Messages on /sermons. Add the service, campus and series, then publish.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "date", label: "Date preached", type: "datetime", required: true },
      { name: "service", label: "Service", type: "select", options: SERVICES, required: true },
      { name: "speaker", label: "Speaker", type: "text", required: true, max: 120 },
      { name: "speakerId", label: "Speaker profile", type: "ref", lookup: "pastors", nullable: "Not linked" },
      campus("All campuses"),
      { name: "seriesId", label: "Series", type: "ref", lookup: "series", nullable: "Not in a series" },
      { name: "partNumber", label: "Part number", type: "number", min: 1, max: 500, help: "Only for sermons in a series." },
      { name: "youtubeId", label: "YouTube video ID", type: "text", max: 11, placeholder: "e.g. dQw4w9WgXcQ", help: "The 11 characters after watch?v= in the YouTube link." },
      { name: "audioUrl", label: "Audio link", type: "url", help: "Spotify, Mixlr or SoundCloud episode." },
      { name: "durationMin", label: "Length (minutes)", type: "number", min: 0, max: 1000 },
      { name: "thumbnail", label: "Thumbnail", type: "image", ratio: "16 / 9", help: "Leave empty to use the YouTube thumbnail." },
      { name: "slug", label: "Web address", type: "text", help: "Made from the title if left empty." },
    ],
    columns: [{ key: "title", label: "Title" }, { key: "date", label: "Date", kind: "date" }, { key: "speaker", label: "Speaker" }, { key: "campusId", label: "Campus", kind: "ref", lookup: "campuses" }, STATUS_COL],
    filters: [PUBLISH_FILTER, { name: "service", label: "Service", options: SERVICES }, CAMPUS_FILTER, { name: "seriesId", label: "Series", lookup: "series" }],
  },
  {
    key: "series", policy: "series", label: "Series", singular: "series", group: "Messages", publishable: true,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "startDate", label: "Start date", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea", max: 2000 },
      { name: "service", label: "Service label", type: "text", max: 80, placeholder: "e.g. Bible Study" },
      { name: "speaker", label: "Speaker label", type: "text", max: 120, placeholder: "e.g. Various speakers" },
      { name: "artwork", label: "Artwork", type: "image", ratio: "16 / 9", help: "16:9 artwork." },
      { name: "slug", label: "Web address", type: "text", help: "Made from the title if left empty." },
    ],
    columns: [{ key: "title", label: "Title" }, { key: "startDate", label: "Started", kind: "date" }, STATUS_COL],
    filters: [PUBLISH_FILTER],
  },
  {
    key: "devotionals", policy: "devotionals", label: "Push Buttons", singular: "devotional", group: "Messages", publishable: true,
    intro: "The weekly Monday devotional on the home page. The three newest published posts show.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "url", label: "Medium post link", type: "url" },
      { name: "audioUrl", label: "Spotify episode link", type: "url" },
      { name: "excerpt", label: "Short excerpt", type: "textarea", max: 500 },
    ],
    columns: [{ key: "title", label: "Title" }, { key: "date", label: "Date", kind: "date" }, { key: "url", label: "Medium", kind: "bool" }, STATUS_COL],
    filters: [PUBLISH_FILTER],
  },
  {
    key: "events", policy: "events", label: "Events", singular: "event", group: "Messages",
    intro: "Events are created in the CRM. Here you choose which ones show on the website and how.",
    fields: [
      { name: "title", label: "Title (from the CRM)", type: "text", readOnly: true },
      { name: "startDate", label: "Starts (from the CRM)", type: "datetime", readOnly: true },
      { name: "status", label: "CRM status", type: "text", readOnly: true, help: "Only published events can show on the website." },
      { name: "website.showOnWebsite", label: "Show on the website", type: "bool" },
      { name: "website.kind", label: "Kind", type: "select", options: [["one_off", "One-off event"], ["yearly_gathering", "Yearly gathering"], ["weekly_service", "Weekly service"]] },
      { name: "website.typeLabel", label: "Type", type: "text", max: 80, placeholder: "e.g. Word conference" },
      { name: "website.featured", label: "Feature in the countdown", type: "bool" },
      { name: "website.link", label: "Registration link", type: "url", help: "An https link, or a site path such as /visit." },
    ],
    columns: [{ key: "title", label: "Title" }, { key: "startDate", label: "Starts", kind: "datetime" }, { key: "status", label: "CRM status" }, { key: "website.showOnWebsite", label: "On website", kind: "bool" }],
    filters: [{ name: "status", label: "CRM status", options: [["draft", "Draft"], ["published", "Published"], ["completed", "Completed"], ["cancelled", "Cancelled"]] }],
  },
  {
    key: "pastors", policy: "pastors", label: "Pastors", singular: "pastor", group: "People & pages", publishable: true,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "role", label: "Role", type: "text", required: true, max: 120 },
      campus("No campus"),
      { name: "bio", label: "Bio", type: "textarea", max: 2000 },
      { name: "photo", label: "Photo", type: "image", ratio: "4 / 5" },
      order,
    ],
    columns: [{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "order", label: "Order" }, STATUS_COL],
    filters: [PUBLISH_FILTER],
  },
  {
    key: "testimonies", policy: "testimonies", label: "Testimonies", singular: "testimony", group: "People & pages", publishable: true,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "body", label: "Testimony", type: "textarea", required: true, max: 1500 },
      campus("No campus"),
      { name: "approved", label: "The person agreed to publish this", type: "bool" },
      { name: "image", label: "Photo", type: "image" },
      order,
    ],
    columns: [{ key: "name", label: "Name" }, { key: "approved", label: "Consent", kind: "bool" }, STATUS_COL],
    filters: [PUBLISH_FILTER],
  },
  {
    key: "units", policy: "units", label: "Units", singular: "unit", group: "People & pages", publishable: true,
    intro: "The units people can serve in (Ministries page).",
    fields: [{ name: "name", label: "Name", type: "text", required: true, max: 80 }, { name: "body", label: "What the unit does", type: "textarea", required: true, max: 1000 }, order],
    columns: [{ key: "name", label: "Name" }, { key: "order", label: "Order" }, STATUS_COL],
    filters: [PUBLISH_FILTER],
  },
  {
    key: "tribe-groups", policy: "tribe_groups", label: "Tribe groups", singular: "tribe group", group: "People & pages", publishable: true,
    fields: [{ name: "name", label: "Name", type: "text", required: true, max: 80 }, { name: "body", label: "Description", type: "textarea", required: true, max: 1000 }, order],
    columns: [{ key: "name", label: "Name" }, { key: "order", label: "Order" }, STATUS_COL],
    filters: [PUBLISH_FILTER],
  },
  {
    key: "faqs", policy: "faqs", label: "FAQs", singular: "FAQ", group: "People & pages", publishable: true,
    fields: [
      { name: "page", label: "Page", type: "select", options: [["visit", "Plan a visit"], ["give", "Give"]], required: true },
      { name: "question", label: "Question", type: "text", required: true, max: 200 },
      { name: "body", label: "Answer", type: "textarea", required: true, max: 2000 },
      order,
    ],
    columns: [{ key: "question", label: "Question" }, { key: "page", label: "Page" }, { key: "order", label: "Order" }, STATUS_COL],
    // `faqPage`, not `page`: `page` is the pager.
    filters: [PUBLISH_FILTER, { name: "faqPage", label: "Page", options: [["visit", "Plan a visit"], ["give", "Give"]] }],
  },
  {
    key: "campuses", policy: "campuses", label: "Campuses", singular: "campus", group: "People & pages",
    intro: "Campuses are set up in the CRM. Here you choose which show on the website and what visitors see.",
    fields: [
      { name: "name", label: "Name (from the CRM)", type: "text", readOnly: true },
      { name: "slug", label: "Web address (from the CRM)", type: "text", readOnly: true },
      { name: "website.showOnWebsite", label: "Show on the website", type: "bool" },
      { name: "website.venue", label: "Venue", type: "text", max: 120, placeholder: "e.g. The Garrison" },
      { name: "website.mapUrl", label: "Map link", type: "url" },
      { name: "website.photoUrl", label: "Campus photo link", type: "url", help: "Upload the photo in a content item first, or paste an https link." },
      { name: "website.pastor", label: "Campus pastor", type: "ref", lookup: "pastors", nullable: "None" },
      { name: "website.serviceTimes", label: "Service times", type: "times" },
      { name: "website.order", label: "Order", type: "number", min: 0, help: "Lower numbers show first." },
    ],
    columns: [{ key: "name", label: "Name" }, { key: "slug", label: "Slug" }, { key: "website.showOnWebsite", label: "On website", kind: "bool" }, { key: "website.order", label: "Order" }],
  },
  {
    key: "products", policy: "products", label: "Products", singular: "product", group: "Shop & giving",
    intro: "Products, prices, stock and orders are managed in the CRM store. Here you set how they appear on the website shop.",
    fields: [
      { name: "name", label: "Name (from the CRM)", type: "text", readOnly: true },
      { name: "price", label: "Price in ₦ (from the CRM)", type: "number", readOnly: true },
      { name: "category", label: "Category", type: "select", options: [["books", "Books"], ["merch", "Merch"], ["accessories", "Accessories"]], nullable: "None" },
      { name: "byline", label: "Byline", type: "text", max: 120, placeholder: "Author, or e.g. Black · S to XXL" },
      { name: "badge", label: "Badge", type: "select", options: [["new", "New"], ["bestseller", "Bestseller"]], nullable: "None" },
      { name: "isFeatured", label: "Featured on the shop page", type: "bool" },
    ],
    columns: [{ key: "name", label: "Name" }, { key: "category", label: "Category" }, { key: "price", label: "Price (₦)" }, { key: "isFeatured", label: "Featured", kind: "bool" }],
  },
  {
    key: "giving-accounts", policy: "giving_accounts", label: "Giving accounts", singular: "giving account", group: "Shop & giving",
    intro: "Changes go live only after someone other than the person who made them approves.",
    fields: [
      { name: "currency", label: "Currency", type: "select", options: [["NGN", "Naira (NGN)"], ["USD", "US dollar (USD)"], ["GBP", "Pound (GBP)"], ["EUR", "Euro (EUR)"]], required: true },
      campus("Shared by every campus"),
      { name: "bank", label: "Bank", type: "text", required: true, max: 120 },
      { name: "accountNumber", label: "Account number", type: "text", required: true, max: 20 },
      { name: "accountName", label: "Account name", type: "text", max: 200 },
      { name: "swift", label: "SWIFT code", type: "text", max: 11 },
      order,
    ],
    columns: [{ key: "bank", label: "Bank" }, { key: "currency", label: "Currency" }, { key: "accountNumber", label: "Number" }, { key: "campusId", label: "Campus", kind: "ref", lookup: "campuses" }, { key: "approvalStatus", label: "Status", kind: "status" }],
    filters: [{ name: "approvalStatus", label: "Approval", options: [["draft", "Draft"], ["approved", "Approved"]] }, CAMPUS_FILTER],
  },
  {
    key: "lost-items", policy: "lost_items", label: "Lost and found", singular: "found item", group: "Care",
    intro: "New items wait for the care desk to review them. Listed items move to the Care Closet after 30 days.",
    reviewStatus: [["pending_review", "Waiting for review"], ["listed", "Listed"], ["claim_pending", "Claim in progress"], ["collected", "Collected"], ["moved_to_care_closet", "Moved to Care Closet"]],
    fields: [
      { name: "description", label: "What is it?", type: "text", required: true, max: 200, placeholder: "e.g. Black umbrella" },
      { name: "type", label: "Type", type: "select", options: [["clothing", "Clothing"], ["bags", "Bags"], ["gadgets", "Gadgets"], ["bottles", "Bottles"], ["keys", "Keys"], ["other", "Other"]], required: true },
      { name: "foundOn", label: "Found on", type: "date", required: true },
      { name: "campusId", label: "Campus", type: "ref", lookup: "campuses", required: true },
      { name: "photo", label: "Photo", type: "image", help: "Don't show anything that identifies the owner (ID cards, screens)." },
    ],
    columns: [{ key: "description", label: "Item" }, { key: "type", label: "Type" }, { key: "foundOn", label: "Found", kind: "date" }, { key: "campusId", label: "Campus", kind: "ref", lookup: "campuses" }, STATUS_COL],
    filters: [
      { name: "status", label: "Status", options: [["pending_review", "Waiting for review"], ["listed", "Listed"], ["claim_pending", "Claim in progress"], ["collected", "Collected"], ["moved_to_care_closet", "Moved to Care Closet"]] },
      CAMPUS_FILTER,
    ],
  },
];

export const resourceByKey = (key: string) => RESOURCES.find((r) => r.key === key);

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", published: "Published", scheduled: "Scheduled", approved: "Approved",
  pending_review: "Waiting for review", listed: "Listed", claim_pending: "Claim in progress", collected: "Collected", moved_to_care_closet: "Moved to Care Closet",
  new: "New", in_progress: "In progress", done: "Done", spam: "Spam",
  pending_payment: "Awaiting payment", paid: "Paid", ready: "Ready for pickup", fulfilled: "Collected", cancelled: "Cancelled", refunded: "Refunded",
  pending: "Pending", rejected: "Rejected", invited: "Invited", active: "Active", disabled: "Switched off",
};

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin", leadership_viewer: "Leadership (view only)", church_admin: "Church admin", content_editor: "Content editor",
  finance_officer: "Finance officer", care_desk: "Care desk", workforce: "Workforce",
};


/* ─── permissions ─────────────────────────────────────────────────────
 * crm-be permissions per action (C create, R read, U update, D delete, P publish,
 * A approve, T totals only, X export). The UI only uses these to show or hide
 * things; crm-be still enforces every permission.
 */
type Rules = Record<string, readonly string[]>;
const CONTENT: Rules = {
  R: ["website:view-content"],
  C: ["website:create-content"],
  U: ["website:update-content"],
  D: ["website:delete-content"],
  P: ["website:publish-content"],
};

export const PERMISSIONS: Record<string, Rules> = {
  sermons: CONTENT,
  series: CONTENT,
  devotionals: CONTENT,
  pastors: CONTENT,
  testimonies: CONTENT,
  units: CONTENT,
  tribe_groups: CONTENT,
  faqs: CONTENT,
  site_settings: { R: ["website:view-content"], U: ["website:manage-settings"] },
  form_submissions: { R: ["website:view-submissions"], U: ["website:manage-submissions"], D: ["website:manage-submissions"] },
  lost_items: { C: ["lost-found:create"], R: ["lost-found:view"], U: ["lost-found:manage"], D: ["lost-found:manage"], P: ["lost-found:manage"] },
  lost_item_claims: { R: ["lost-found:view-claims"], U: ["lost-found:manage-claims"] },
  giving_accounts: { R: ["giving:view-accounts"], C: ["giving:manage-accounts"], U: ["giving:manage-accounts"], D: ["giving:manage-accounts"], A: ["giving:approve-accounts"] },
  donations: { R: ["giving:view-donations"], T: ["giving:view-donation-totals", "giving:view-donations"], X: ["giving:export-donations"] },
  // Edit-only website fields on CRM records (created and deleted in the CRM).
  events: { R: ["events:view"], U: ["events:update"] },
  campuses: { R: ["branches:view"], U: ["branches:update"] },
  products: { R: ["store:view-products"], U: ["store:update-product"] },
};
