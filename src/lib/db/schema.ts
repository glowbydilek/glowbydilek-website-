/**
 * Glow by Dilek — database schema (MySQL / MariaDB, Drizzle ORM).
 *
 * Conventions
 * - All timestamps are stored in UTC (`datetime(3)`, mode "date"). Business
 *   times are displayed and entered in Europe/Amsterdam (see lib/time.ts).
 * - Secrets are never stored in plain text: passwords (scrypt), session and
 *   reset tokens (SHA-256), recovery codes (scrypt), MFA secrets (AES-GCM).
 * - Content written by the owner lives here, so deployments never overwrite it.
 *
 * Migrations: drizzle/ (generated with `npm run db:generate`, applied with
 * `npm run db:migrate`).
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const now = () => sql`CURRENT_TIMESTAMP(3)`;
const ts = (name: string) => datetime(name, { mode: "date", fsp: 3 });
const created = () => ts("created_at").notNull().default(now());
const updated = () => ts("updated_at").notNull().default(now()).$onUpdate(() => new Date());

const longblob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "longblob",
});

// ─────────────────────────────────────────────────────────── Identity & auth

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull().default(""),
  /** owner = full access; staff reserved for later (no UI to create yet). */
  role: varchar("role", { length: 20 }).notNull().default("owner"),
  /** scrypt$N$r$p$salt$hash — null until the owner sets a password via the reset flow. */
  passwordHash: varchar("password_hash", { length: 255 }),
  passwordChangedAt: ts("password_changed_at"),
  mfaSecretEnc: varchar("mfa_secret_enc", { length: 255 }),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  failedLogins: int("failed_logins").notNull().default(0),
  lockedUntil: ts("locked_until"),
  lastLoginAt: ts("last_login_at"),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: created(),
  updatedAt: updated(),
});

export const sessions = mysqlTable(
  "sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    /** False while the second factor is still required. */
    mfaPassed: boolean("mfa_passed").notNull().default(false),
    createdAt: created(),
    lastSeenAt: ts("last_seen_at").notNull().default(now()),
    expiresAt: ts("expires_at").notNull(),
    revokedAt: ts("revoked_at"),
    userAgent: varchar("user_agent", { length: 255 }),
    ipHash: varchar("ip_hash", { length: 64 }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdAt: created(),
  },
  (t) => [index("prt_user_idx").on(t.userId)],
);

export const mfaRecoveryCodes = mysqlTable(
  "mfa_recovery_codes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: varchar("code_hash", { length: 255 }).notNull(),
    usedAt: ts("used_at"),
    createdAt: created(),
  },
  (t) => [index("mrc_user_idx").on(t.userId)],
);

/** Persistent, shared rate-limit windows and one-time keys (Turnstile replay, duplicates). */
export const rateLimits = mysqlTable("rate_limits", {
  key: varchar("key", { length: 190 }).primaryKey(),
  count: int("count").notNull().default(0),
  windowStart: ts("window_start").notNull(),
  expiresAt: ts("expires_at").notNull(),
});

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id"),
    action: varchar("action", { length: 80 }).notNull(),
    entity: varchar("entity", { length: 60 }),
    entityId: varchar("entity_id", { length: 80 }),
    details: json("details"),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: created(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt), index("audit_action_idx").on(t.action)],
);

// ───────────────────────────────────────────────────────── Settings & content

/** Key/value settings (theme, navigation, footer, booking rules, business info…). */
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: updated(),
  updatedBy: int("updated_by"),
});

/**
 * Editable content documents. `docKey` identifies a document such as
 * "page:home", "category:face" or "treatment:brazilian". The stored data is
 * an override merged over the built-in default copy.
 */
export const contentEntries = mysqlTable(
  "content_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    docKey: varchar("doc_key", { length: 120 }).notNull(),
    locale: varchar("locale", { length: 5 }).notNull(),
    status: varchar("status", { length: 12 }).notNull(), // draft | published
    data: json("data").notNull(),
    version: int("version").notNull().default(1),
    updatedAt: updated(),
    updatedBy: int("updated_by"),
  },
  (t) => [uniqueIndex("content_doc_locale_status").on(t.docKey, t.locale, t.status)],
);

export const contentVersions = mysqlTable(
  "content_versions",
  {
    id: int("id").autoincrement().primaryKey(),
    docKey: varchar("doc_key", { length: 120 }).notNull(),
    locale: varchar("locale", { length: 5 }).notNull(),
    version: int("version").notNull(),
    data: json("data").notNull(),
    note: varchar("note", { length: 200 }),
    createdAt: created(),
    createdBy: int("created_by"),
  },
  (t) => [index("cv_doc_idx").on(t.docKey, t.locale, t.version)],
);

/** Owner-created editorial pages (/info/<slug> and /en/info/<slug>). */
export const customPages = mysqlTable("custom_pages", {
  id: int("id").autoincrement().primaryKey(),
  slugNl: varchar("slug_nl", { length: 120 }).notNull().unique(),
  slugEn: varchar("slug_en", { length: 120 }).notNull().unique(),
  published: boolean("published").notNull().default(false),
  noindex: boolean("noindex").notNull().default(false),
  createdAt: created(),
  updatedAt: updated(),
});

export const redirects = mysqlTable("redirects", {
  id: int("id").autoincrement().primaryKey(),
  fromPath: varchar("from_path", { length: 255 }).notNull().unique(),
  toPath: varchar("to_path", { length: 255 }).notNull(),
  permanent: boolean("permanent").notNull().default(true),
  createdAt: created(),
});

// ───────────────────────────────────────────────────────────────────── Media

export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 200 }).notNull(),
  mime: varchar("mime", { length: 60 }).notNull(),
  width: int("width").notNull(),
  height: int("height").notNull(),
  bytes: int("bytes").notNull(),
  altNl: varchar("alt_nl", { length: 300 }).notNull().default(""),
  altEn: varchar("alt_en", { length: 300 }).notNull().default(""),
  focusMobile: varchar("focus_mobile", { length: 20 }).notNull().default("50% 50%"),
  focusDesktop: varchar("focus_desktop", { length: 20 }).notNull().default("50% 50%"),
  source: varchar("source", { length: 300 }).notNull().default(""),
  license: varchar("license", { length: 300 }).notNull().default(""),
  createdAt: created(),
  updatedAt: updated(),
});

/** Optimised renditions stored in the database: durable across deployments and included in backups. */
export const mediaVariants = mysqlTable(
  "media_variants",
  {
    mediaId: int("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    width: int("width").notNull(),
    mime: varchar("mime", { length: 60 }).notNull(),
    data: longblob("data").notNull(),
  },
  (t) => [primaryKey({ columns: [t.mediaId, t.width] })],
);

// ──────────────────────────────────────────────────────────────── Treatments

export const treatments = mysqlTable("treatments", {
  id: varchar("id", { length: 60 }).primaryKey(),
  category: varchar("category", { length: 30 }).notNull(),
  nameNl: varchar("name_nl", { length: 120 }).notNull(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  descriptionNl: text("description_nl").notNull(),
  descriptionEn: text("description_en").notNull(),
  /** Confirmed price in cents; null = "on request". */
  priceCents: int("price_cents"),
  priceFrom: boolean("price_from").notNull().default(false),
  /** Confirmed duration; null = not offered in automatic time slots. */
  durationMinutes: smallint("duration_minutes"),
  bufferMinutes: smallint("buffer_minutes").notNull().default(0),
  active: boolean("active").notNull().default(true),
  visible: boolean("visible").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  bookableOnline: boolean("bookable_online").notNull().default(false),
  mediaId: int("media_id"),
  sort: int("sort").notNull().default(0),
  /**
   * Catalogue (migration 0002). `kind` = treatment | package. A null section
   * means "waxing" and a null group falls back to `category` (rows created
   * before 0002). Status: draft | published | archived — only published,
   * active and visible items appear on the website.
   */
  kind: varchar("kind", { length: 12 }).notNull().default("treatment"),
  sectionId: varchar("section_id", { length: 60 }),
  groupId: varchar("group_id", { length: 60 }),
  slugNl: varchar("slug_nl", { length: 120 }),
  slugEn: varchar("slug_en", { length: 120 }),
  status: varchar("status", { length: 12 }).notNull().default("published"),
  /** fixed | from | on_request. Null (pre-0002) = derived from priceCents/priceFrom. */
  pricingMode: varchar("pricing_mode", { length: 12 }),
  /** VAT category chosen by the owner/accountant: standard | reduced | zero | exempt. */
  vatCategory: varchar("vat_category", { length: 12 }).notNull().default("standard"),
  /** Related item ids, gallery media ids. */
  related: json("related"),
  gallery: json("gallery"),
  createdAt: created(),
  updatedAt: updated(),
});

/** Top-level service sections (Waxbehandelingen, Gezichtsbehandelingen, …). */
export const serviceSections = mysqlTable("service_sections", {
  id: varchar("id", { length: 60 }).primaryKey(),
  kind: varchar("kind", { length: 12 }).notNull().default("treatments"), // treatments | packages
  slugNl: varchar("slug_nl", { length: 80 }).notNull().unique(),
  slugEn: varchar("slug_en", { length: 80 }).notNull().unique(),
  nameNl: varchar("name_nl", { length: 120 }).notNull(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  status: varchar("status", { length: 12 }).notNull().default("draft"),
  mediaId: int("media_id"),
  sort: int("sort").notNull().default(0),
  createdAt: created(),
  updatedAt: updated(),
});

/** Optional sub-categories within a section (e.g. waxing: face, body, bikini). */
export const serviceGroups = mysqlTable(
  "service_groups",
  {
    id: varchar("id", { length: 60 }).primaryKey(),
    sectionId: varchar("section_id", { length: 60 }).notNull(),
    slugNl: varchar("slug_nl", { length: 80 }).notNull(),
    slugEn: varchar("slug_en", { length: 80 }).notNull(),
    nameNl: varchar("name_nl", { length: 120 }).notNull(),
    nameEn: varchar("name_en", { length: 120 }).notNull(),
    status: varchar("status", { length: 12 }).notNull().default("draft"),
    mediaId: int("media_id"),
    sort: int("sort").notNull().default(0),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex("group_slug_nl_idx").on(t.sectionId, t.slugNl), uniqueIndex("group_slug_en_idx").on(t.sectionId, t.slugEn)],
);

/** Contents of a package (a `treatments` row with kind = package). */
export const packageItems = mysqlTable(
  "package_items",
  {
    packageId: varchar("package_id", { length: 60 }).notNull(),
    treatmentId: varchar("treatment_id", { length: 60 }).notNull(),
    quantity: smallint("quantity").notNull().default(1),
    sort: int("sort").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.treatmentId] })],
);

/** Honest price history: every change of a list price is recorded (no invented "was" prices). */
export const priceHistory = mysqlTable(
  "price_history",
  {
    id: int("id").autoincrement().primaryKey(),
    itemId: varchar("item_id", { length: 60 }).notNull(),
    pricingMode: varchar("pricing_mode", { length: 12 }).notNull(),
    priceCents: int("price_cents"),
    userId: int("user_id"),
    createdAt: created(),
  },
  (t) => [index("ph_item_idx").on(t.itemId, t.createdAt)],
);

// ─────────────────────────────────────────────────────── Customers & bookings

export const customers = mysqlTable(
  "customers",
  {
    id: int("id").autoincrement().primaryKey(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull().default(""),
    email: varchar("email", { length: 190 }),
    phone: varchar("phone", { length: 32 }),
    locale: varchar("locale", { length: 5 }).notNull().default("nl"),
    notes: text("notes"),
    consentAt: ts("consent_at"),
    privacyVersion: varchar("privacy_version", { length: 20 }),
    anonymizedAt: ts("anonymized_at"),
    /** Normalised for matching returning customers (lower-case email; E.164-like phone digits). */
    emailNorm: varchar("email_norm", { length: 190 }),
    phoneNorm: varchar("phone_norm", { length: 20 }),
    /** Set when this profile was merged into another one (history moved, row kept for the audit trail). */
    mergedIntoId: int("merged_into_id"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    index("customers_email_idx").on(t.email),
    index("customers_phone_idx").on(t.phone),
    index("customers_name_idx").on(t.lastName, t.firstName),
    index("customers_email_norm_idx").on(t.emailNorm),
    index("customers_phone_norm_idx").on(t.phoneNorm),
  ],
);

export const appointments = mysqlTable(
  "appointments",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customer_id")
      .notNull()
      .references(() => customers.id),
    /**
     * requested → confirmed | declined | proposed
     * proposed → confirmed | declined | cancelled
     * confirmed → completed | no_show | cancelled
     */
    status: varchar("status", { length: 16 }).notNull(),
    /** Exact time (UTC). Null for legacy "preferred day + part of day" requests. */
    startAt: ts("start_at"),
    endAt: ts("end_at"),
    /** endAt + buffer: what the slot occupies in the calendar. */
    blockedUntil: ts("blocked_until"),
    durationMinutes: smallint("duration_minutes"),
    bufferMinutes: smallint("buffer_minutes").notNull().default(0),
    /** Legacy request fields (preferred date and part of day). */
    requestedDate: date("requested_date", { mode: "string" }),
    requestedTimeRange: varchar("requested_time_range", { length: 16 }),
    requestedAlternative: varchar("requested_alternative", { length: 200 }),
    source: varchar("source", { length: 16 }).notNull(), // request | manual
    locale: varchar("locale", { length: 5 }).notNull().default("nl"),
    customerNote: text("customer_note"),
    internalNote: text("internal_note"),
    /**
     * Agreed price for this appointment in cents, snapshotted from the
     * treatment list (or entered by the owner). Never changes when list
     * prices change later. Null = no price known (nothing is invented).
     */
    priceCents: int("price_cents"),
    /** Discount applied to the agreed price (0002), and the promotion it came from. */
    discountCents: int("discount_cents"),
    promotionId: int("promotion_id"),
    /** Per-appointment invoice behaviour: null = follow settings | manual | none. */
    invoiceMode: varchar("invoice_mode", { length: 12 }),
    archivedAt: ts("archived_at"),
    version: int("version").notNull().default(1),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    index("appt_start_idx").on(t.startAt),
    index("appt_status_idx").on(t.status),
    index("appt_customer_idx").on(t.customerId),
  ],
);

export const appointmentTreatments = mysqlTable(
  "appointment_treatments",
  {
    appointmentId: int("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    treatmentId: varchar("treatment_id", { length: 60 }).notNull(),
    /** Name snapshot, so history stays readable if a treatment is renamed. */
    nameNl: varchar("name_nl", { length: 120 }).notNull(),
    nameEn: varchar("name_en", { length: 120 }).notNull(),
    durationMinutes: smallint("duration_minutes"),
    /** List price at booking time (cents), null when no price was configured. */
    priceCents: int("price_cents"),
  },
  (t) => [primaryKey({ columns: [t.appointmentId, t.treatmentId] })],
);

export const appointmentEvents = mysqlTable(
  "appointment_events",
  {
    id: int("id").autoincrement().primaryKey(),
    appointmentId: int("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    fromStatus: varchar("from_status", { length: 16 }),
    toStatus: varchar("to_status", { length: 16 }),
    data: json("data"),
    userId: int("user_id"),
    createdAt: created(),
  },
  (t) => [index("ae_appt_idx").on(t.appointmentId)],
);

/** One row per local date, locked (SELECT … FOR UPDATE) to serialise bookings for that day. */
export const scheduleLocks = mysqlTable("schedule_locks", {
  day: date("day", { mode: "string" }).primaryKey(),
});

// ──────────────────────────────────────────────────────────── Availability

/** Repeating weekly intervals. weekday: 1 = Monday … 7 = Sunday. Minutes from local midnight. */
export const weeklyHours = mysqlTable(
  "weekly_hours",
  {
    id: int("id").autoincrement().primaryKey(),
    weekday: tinyint("weekday").notNull(),
    kind: varchar("kind", { length: 8 }).notNull(), // open | break
    startMinute: smallint("start_minute").notNull(),
    endMinute: smallint("end_minute").notNull(),
  },
  (t) => [index("wh_weekday_idx").on(t.weekday)],
);

/** A date that deviates from the weekly template. */
export const dateOverrides = mysqlTable("date_overrides", {
  day: date("day", { mode: "string" }).primaryKey(),
  closed: boolean("closed").notNull().default(false),
  /** If true, the intervals below replace the weekly ones for this day. */
  customHours: boolean("custom_hours").notNull().default(false),
  capacity: tinyint("capacity"),
  maxAppointments: smallint("max_appointments"),
  note: varchar("note", { length: 200 }),
});

export const overrideIntervals = mysqlTable(
  "override_intervals",
  {
    id: int("id").autoincrement().primaryKey(),
    day: date("day", { mode: "string" }).notNull(),
    kind: varchar("kind", { length: 8 }).notNull(), // open | break
    startMinute: smallint("start_minute").notNull(),
    endMinute: smallint("end_minute").notNull(),
  },
  (t) => [index("oi_day_idx").on(t.day)],
);

/** Blocked periods (holiday, personal appointment, temporarily unavailable). */
export const blocks = mysqlTable(
  "blocks",
  {
    id: int("id").autoincrement().primaryKey(),
    startAt: ts("start_at").notNull(),
    endAt: ts("end_at").notNull(),
    reason: varchar("reason", { length: 200 }).notNull().default(""),
    createdAt: created(),
  },
  (t) => [index("blocks_range_idx").on(t.startAt, t.endAt)],
);

// ───────────────────────────────────────────────────────────── Notifications

export const notificationTemplates = mysqlTable(
  "notification_templates",
  {
    key: varchar("key", { length: 60 }).notNull(),
    locale: varchar("locale", { length: 5 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    body: text("body").notNull(),
    updatedAt: updated(),
  },
  (t) => [primaryKey({ columns: [t.key, t.locale] })],
);

/**
 * Transactional outbox. Rows are written in the same transaction as the
 * change they describe; delivery happens afterwards (inline attempt + cron
 * retries). `dedupeKey` makes every notification idempotent.
 */
export const outbox = mysqlTable(
  "outbox",
  {
    id: int("id").autoincrement().primaryKey(),
    dedupeKey: varchar("dedupe_key", { length: 190 }).notNull().unique(),
    kind: varchar("kind", { length: 40 }).notNull(),
    appointmentId: int("appointment_id"),
    toEmail: varchar("to_email", { length: 190 }).notNull(),
    replyTo: varchar("reply_to", { length: 190 }),
    subject: varchar("subject", { length: 250 }).notNull(),
    html: text("html").notNull(),
    textBody: text("text_body").notNull(),
    /** Optional attachment, generated at send time from an immutable record (e.g. an issued invoice PDF). */
    attachmentKind: varchar("attachment_kind", { length: 20 }),
    attachmentRef: int("attachment_ref"),
    customerId: int("customer_id"),
    status: varchar("status", { length: 12 }).notNull().default("pending"), // pending | sending | sent | failed | cancelled
    attempts: int("attempts").notNull().default(0),
    sendAfter: ts("send_after").notNull().default(now()),
    lockedAt: ts("locked_at"),
    lastError: varchar("last_error", { length: 200 }),
    sentAt: ts("sent_at"),
    createdAt: created(),
  },
  (t) => [index("outbox_due_idx").on(t.status, t.sendAfter), index("outbox_appt_idx").on(t.appointmentId)],
);

export const cronRuns = mysqlTable("cron_runs", {
  id: int("id").autoincrement().primaryKey(),
  startedAt: ts("started_at").notNull().default(now()),
  finishedAt: ts("finished_at"),
  sent: int("sent").notNull().default(0),
  failed: int("failed").notNull().default(0),
  error: varchar("error", { length: 200 }),
});

// ──────────────────────────────────────────────────────────────── Inbox

export const inquiries = mysqlTable(
  "inquiries",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 190 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    topic: varchar("topic", { length: 20 }).notNull(),
    message: text("message").notNull(),
    locale: varchar("locale", { length: 5 }).notNull(),
    status: varchar("status", { length: 12 }).notNull().default("new"), // new | read | replied | closed
    consentAt: ts("consent_at").notNull(),
    readAt: ts("read_at"),
    createdAt: created(),
  },
  (t) => [index("inq_status_idx").on(t.status, t.createdAt)],
);

// ──────────────────────────────────────────────────────────────── CRM

/** Manual merges of duplicate customer profiles (audit trail; never automatic). */
export const customerMerges = mysqlTable("customer_merges", {
  id: int("id").autoincrement().primaryKey(),
  fromCustomerId: int("from_customer_id").notNull(),
  intoCustomerId: int("into_customer_id").notNull(),
  snapshot: json("snapshot").notNull(),
  userId: int("user_id"),
  createdAt: created(),
});

// ──────────────────────────────────────────────────────────────── Finance

/**
 * Money actually received or refunded. Amounts in integer cents
 * (refunds negative). Treatment list prices, appointment prices, invoiced
 * amounts and received payments are kept separate on purpose.
 */
export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customer_id")
      .notNull()
      .references(() => customers.id),
    appointmentId: int("appointment_id"),
    invoiceId: int("invoice_id"),
    amountCents: int("amount_cents").notNull(),
    method: varchar("method", { length: 16 }).notNull(), // cash | pin | transfer | tikkie | other
    kind: varchar("kind", { length: 10 }).notNull().default("payment"), // payment | refund
    paidOn: date("paid_on", { mode: "string" }).notNull(),
    note: varchar("note", { length: 300 }),
    voidedAt: ts("voided_at"),
    voidReason: varchar("void_reason", { length: 200 }),
    userId: int("user_id"),
    createdAt: created(),
  },
  (t) => [index("pay_customer_idx").on(t.customerId), index("pay_date_idx").on(t.paidOn), index("pay_invoice_idx").on(t.invoiceId), index("pay_appt_idx").on(t.appointmentId)],
);

/** Sequential invoice numbers per year, allocated under a row lock. */
export const invoiceCounters = mysqlTable("invoice_counters", {
  year: int("year").primaryKey(),
  last: int("last").notNull(),
});

/**
 * Invoices and credit invoices. A draft can be edited; once issued the
 * number, seller/customer details, lines, totals and the PDF are frozen.
 * Corrections are made with a credit invoice, never by editing.
 */
export const invoices = mysqlTable(
  "invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    number: varchar("number", { length: 32 }).unique(),
    kind: varchar("kind", { length: 10 }).notNull().default("invoice"), // invoice | credit
    status: varchar("status", { length: 10 }).notNull().default("draft"), // draft | issued
    correctsInvoiceId: int("corrects_invoice_id"),
    customerId: int("customer_id")
      .notNull()
      .references(() => customers.id),
    appointmentId: int("appointment_id"),
    issueDate: date("issue_date", { mode: "string" }),
    dueDate: date("due_date", { mode: "string" }),
    supplyDate: date("supply_date", { mode: "string" }),
    seller: json("seller"),
    buyer: json("buyer").notNull(),
    lines: json("lines").notNull(),
    vatMode: varchar("vat_mode", { length: 12 }),
    subtotalCents: int("subtotal_cents").notNull().default(0),
    vatCents: int("vat_cents").notNull().default(0),
    totalCents: int("total_cents").notNull().default(0),
    note: varchar("note", { length: 500 }),
    locale: varchar("locale", { length: 5 }).notNull().default("nl"),
    pdf: longblob("pdf"),
    pdfSha256: varchar("pdf_sha256", { length: 64 }),
    issuedAt: ts("issued_at"),
    userId: int("user_id"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index("inv_customer_idx").on(t.customerId), index("inv_issue_idx").on(t.issueDate), index("inv_status_idx").on(t.status)],
);

// ──────────────────────────────────────────────────────────────── Reviews

export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    rating: tinyint("rating").notNull(),
    body: text("body").notNull(),
    displayName: varchar("display_name", { length: 60 }).notNull(),
    /** name | initials | anonymous — what the public page shows. */
    displayMode: varchar("display_mode", { length: 12 }).notNull().default("name"),
    treatmentId: varchar("treatment_id", { length: 60 }),
    locale: varchar("locale", { length: 5 }).notNull(),
    /** pending | published | rejected | removed */
    status: varchar("status", { length: 12 }).notNull().default("pending"),
    /** True when submitted through an invitation linked to a completed appointment. */
    verified: boolean("verified").notNull().default(false),
    customerId: int("customer_id"),
    appointmentId: int("appointment_id"),
    ownerReply: text("owner_reply"),
    moderationNote: varchar("moderation_note", { length: 300 }),
    reportCount: int("report_count").notNull().default(0),
    emailHash: varchar("email_hash", { length: 64 }),
    publishedAt: ts("published_at"),
    moderatedAt: ts("moderated_at"),
    createdAt: created(),
  },
  (t) => [index("rev_status_idx").on(t.status, t.publishedAt)],
);

export const reviewInvites = mysqlTable("review_invites", {
  id: int("id").autoincrement().primaryKey(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  appointmentId: int("appointment_id").notNull(),
  customerId: int("customer_id").notNull(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  createdAt: created(),
});

// ──────────────────────────────────────────────── Consultation (special category data)

/**
 * Treatment-safety consultation per customer. The answers are encrypted at
 * rest (AES-256-GCM, key from CONSULTATION_KEY, separate from AUTH_SECRET)
 * and never appear in exports, emails, invoices, analytics or reports.
 * Every view and change is written to the audit log.
 */
export const consultations = mysqlTable(
  "consultations",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customer_id")
      .notNull()
      .references(() => customers.id),
    dataEnc: text("data_enc").notNull(),
    formVersion: varchar("form_version", { length: 20 }).notNull(),
    consentAt: ts("consent_at").notNull(),
    consentMethod: varchar("consent_method", { length: 20 }).notNull(), // in_person | written | digital
    consentTextVersion: varchar("consent_text_version", { length: 20 }).notNull(),
    reviewedAt: ts("reviewed_at").notNull(),
    nextReviewAt: ts("next_review_at").notNull(),
    withdrawnAt: ts("withdrawn_at"),
    userId: int("user_id"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex("consult_customer_idx").on(t.customerId)],
);

// ─────────────────────────────────────────────── Quotes ("prijs op aanvraag")

/**
 * A price proposal for an appointment whose treatment has no fixed price.
 * The customer accepts through a single-use link (token stored hashed); the
 * accepted amount becomes the appointment's agreed price.
 */
export const priceQuotes = mysqlTable(
  "price_quotes",
  {
    id: int("id").autoincrement().primaryKey(),
    appointmentId: int("appointment_id").notNull(),
    amountCents: int("amount_cents").notNull(),
    message: text("message"),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    status: varchar("status", { length: 12 }).notNull().default("sent"), // sent | accepted | declined | withdrawn | expired
    expiresAt: ts("expires_at").notNull(),
    respondedAt: ts("responded_at"),
    responseIpHash: varchar("response_ip_hash", { length: 64 }),
    userId: int("user_id"),
    createdAt: created(),
  },
  (t) => [index("quote_appt_idx").on(t.appointmentId)],
);

// ───────────────────────────────────────────── Promotions & campaign slider

export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  nameNl: varchar("name_nl", { length: 120 }).notNull(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  /** percent (value in basis points) | fixed (value in cents). */
  kind: varchar("kind", { length: 10 }).notNull(),
  value: int("value").notNull(),
  /** all | section | items */
  scope: varchar("scope", { length: 10 }).notNull().default("all"),
  scopeIds: json("scope_ids"),
  /** Optional promo code (stored upper-case). Null = applied automatically. */
  code: varchar("code", { length: 40 }).unique(),
  startsAt: ts("starts_at"),
  endsAt: ts("ends_at"),
  maxUses: int("max_uses"),
  usedCount: int("used_count").notNull().default(0),
  minSpendCents: int("min_spend_cents"),
  status: varchar("status", { length: 10 }).notNull().default("draft"), // draft | active | archived
  /** Show the promotion's text on the public site (prices, service pages). */
  showPublic: boolean("show_public").notNull().default(false),
  noteNl: varchar("note_nl", { length: 300 }),
  noteEn: varchar("note_en", { length: 300 }),
  createdAt: created(),
  updatedAt: updated(),
});

export const promotionRedemptions = mysqlTable(
  "promotion_redemptions",
  {
    id: int("id").autoincrement().primaryKey(),
    promotionId: int("promotion_id").notNull(),
    appointmentId: int("appointment_id").notNull(),
    discountCents: int("discount_cents").notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex("redeem_appt_idx").on(t.appointmentId), index("redeem_promo_idx").on(t.promotionId)],
);

/** Homepage campaign slider. Hidden when there is no active slide. */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  titleNl: varchar("title_nl", { length: 140 }).notNull(),
  titleEn: varchar("title_en", { length: 140 }).notNull(),
  textNl: varchar("text_nl", { length: 400 }).notNull().default(""),
  textEn: varchar("text_en", { length: 400 }).notNull().default(""),
  ctaNl: varchar("cta_nl", { length: 60 }).notNull().default(""),
  ctaEn: varchar("cta_en", { length: 60 }).notNull().default(""),
  /** Internal path only (validated). */
  href: varchar("href", { length: 200 }).notNull().default(""),
  mediaId: int("media_id"),
  startsAt: ts("starts_at"),
  endsAt: ts("ends_at"),
  status: varchar("status", { length: 10 }).notNull().default("draft"), // draft | active | archived
  sort: int("sort").notNull().default(0),
  createdAt: created(),
  updatedAt: updated(),
});

// ───────────────────────────────────────────── Products, protocols, stock

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  brand: varchar("brand", { length: 80 }).notNull().default(""),
  variant: varchar("variant", { length: 120 }).notNull().default(""),
  category: varchar("category", { length: 40 }).notNull().default("other"),
  mediaId: int("media_id"),
  description: text("description"),
  /** How the owner actually uses it (only what was verified). */
  usage: text("usage"),
  notes: text("notes"),
  professionalOnly: boolean("professional_only").notNull().default(false),
  supplier: varchar("supplier", { length: 160 }).notNull().default(""),
  costCents: int("cost_cents"),
  stockQty: int("stock_qty"),
  reorderLevel: int("reorder_level"),
  batch: varchar("batch", { length: 60 }).notNull().default(""),
  expiresOn: date("expires_on", { mode: "string" }),
  status: varchar("status", { length: 10 }).notNull().default("active"), // active | archived
  /** Optional public "Producten & verzorging" listing (off by default). */
  showPublic: boolean("show_public").notNull().default(false),
  createdAt: created(),
  updatedAt: updated(),
});

/** Internal treatment protocol: ordered steps, optionally with products. */
export const protocols = mysqlTable("protocols", {
  treatmentId: varchar("treatment_id", { length: 60 }).primaryKey(),
  steps: json("steps").notNull(),
  notes: text("notes"),
  userId: int("user_id"),
  updatedAt: updated(),
});

export const stockMovements = mysqlTable(
  "stock_movements",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("product_id").notNull(),
    quantity: int("quantity").notNull(),
    reason: varchar("reason", { length: 20 }).notNull(), // purchase | used | correction | expired
    appointmentId: int("appointment_id"),
    note: varchar("note", { length: 300 }),
    userId: int("user_id"),
    createdAt: created(),
  },
  (t) => [index("stock_product_idx").on(t.productId, t.createdAt)],
);

// ───────────────────────────────────────────────────────────── Expenses

export const expenses = mysqlTable(
  "expenses",
  {
    id: int("id").autoincrement().primaryKey(),
    spentOn: date("spent_on", { mode: "string" }).notNull(),
    category: varchar("category", { length: 40 }).notNull(),
    vendor: varchar("vendor", { length: 160 }).notNull().default(""),
    description: varchar("description", { length: 300 }).notNull().default(""),
    /** Gross amount (incl. VAT) in cents. */
    amountCents: int("amount_cents").notNull(),
    vatRateBp: int("vat_rate_bp"),
    vatCents: int("vat_cents"),
    status: varchar("status", { length: 10 }).notNull().default("paid"), // paid | open | void
    notes: text("notes"),
    userId: int("user_id"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index("exp_date_idx").on(t.spentOn)],
);

/** Receipts are private files: stored in the database, never under /media. */
export const expenseReceipts = mysqlTable(
  "expense_receipts",
  {
    id: int("id").autoincrement().primaryKey(),
    expenseId: int("expense_id").notNull(),
    filename: varchar("filename", { length: 160 }).notNull(),
    mime: varchar("mime", { length: 60 }).notNull(),
    size: int("size").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    data: longblob("data").notNull(),
    createdAt: created(),
  },
  (t) => [index("receipt_exp_idx").on(t.expenseId)],
);

// ─────────────────────────────────────── Intake & consent (printed, signed)

/**
 * Master "Intake & toestemming" form, one per language, with controlled
 * revisions: a new version starts as a draft; activating it retires the
 * previous one. Active and retired versions are never edited, so every
 * signed copy can be traced to the exact wording the client signed.
 */
export const intakeTemplates = mysqlTable(
  "intake_templates",
  {
    id: int("id").autoincrement().primaryKey(),
    locale: varchar("locale", { length: 2 }).notNull(),
    version: varchar("version", { length: 40 }).notNull(),
    status: varchar("status", { length: 10 }).notNull(), // draft | active | retired
    title: varchar("title", { length: 200 }).notNull(),
    source: text("source").notNull(),
    changeNote: varchar("change_note", { length: 300 }),
    createdBy: int("created_by"),
    createdAt: created(),
    activatedAt: ts("activated_at"),
    retiredAt: ts("retired_at"),
  },
  (t) => [uniqueIndex("intake_tpl_version_idx").on(t.locale, t.version), index("intake_tpl_status_idx").on(t.locale, t.status)],
);

/**
 * Signed intake forms uploaded per customer (photo or PDF). The file is
 * stored encrypted (AES-256-GCM, INTAKE_DOCUMENT_KEY) in the database —
 * never under /media or the public folder. Images are re-encoded first so
 * EXIF/GPS metadata is removed. Older uploads stay as history; deletion
 * wipes the file and keeps only non-health metadata for the audit trail.
 */
export const intakeDocuments = mysqlTable(
  "intake_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customer_id").notNull(),
    templateVersion: varchar("template_version", { length: 40 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    signedOn: date("signed_on", { mode: "string" }).notNull(),
    status: varchar("status", { length: 12 }).notNull(), // current | superseded | deleted
    mime: varchar("mime", { length: 60 }).notNull(),
    size: int("size").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    originalSha256: varchar("original_sha256", { length: 64 }).notNull(),
    metadataStripped: boolean("metadata_stripped").notNull().default(false),
    dataEnc: longblob("data_enc"),
    note: varchar("note", { length: 300 }),
    uploadedBy: int("uploaded_by"),
    createdAt: created(),
    supersededAt: ts("superseded_at"),
    deletedAt: ts("deleted_at"),
    deletedBy: int("deleted_by"),
    deleteReason: varchar("delete_reason", { length: 200 }),
  },
  (t) => [index("intake_doc_customer_idx").on(t.customerId, t.status)],
);
