/**
 * Shapes of the long-form service and guide copy. Each language has its own
 * file (`*.nl.ts`, `*.en.ts`) typed against these, so a missing translation
 * fails the type check.
 *
 * Truthfulness: no prices, durations, pain-free claims, guaranteed results,
 * qualifications or locations. Anything that still needs the owner's
 * confirmation is listed in docs/OWNER-CHECKLIST.md — never on the site.
 */
import type { CategoryId, TreatmentId } from "../slugs";

export type QA = { q: string; a: string };
export type Step = { title: string; body: string };

export type CategoryCopy = {
  seoTitle: string;
  seoDescription: string;
  /** Short label used in menus and cards. */
  label: string;
  hero: { eyebrow: string; title: string; titleEm: string; subtitle: string };
  intro: { title: string; paragraphs: string[] };
  involves: { title: string; paragraphs: string[] };
  expect: { title: string; steps: Step[] };
  suitable: { title: string; items: string[] };
  preparation: string[];
  aftercare: string[];
  precautions: string[];
  faqs: QA[];
  /** One-line teaser for cards on other pages. */
  teaser: string;
};

export type TreatmentCopy = {
  seoTitle: string;
  seoDescription: string;
  /** H1 */
  title: string;
  lead: string;
  /** Which area is treated. */
  area: string;
  /** How the appointment goes. */
  appointment: string[];
  /** What to know before booking. */
  know: string[];
  /** Precautions and possible skin reactions. */
  reactions: string[];
  aftercare: string[];
  /** Preparation and recovery, in a short paragraph. */
  recovery: string;
  faqs: QA[];
  /** One-line teaser for cards. */
  teaser: string;
};

export type CategoryCopySet = Record<CategoryId, CategoryCopy>;
export type TreatmentCopySet = Record<TreatmentId, TreatmentCopy>;

export type GuideSection = { title: string; paragraphs?: string[]; items?: string[] };

export type GuideCopy = {
  seoTitle: string;
  seoDescription: string;
  hero: { eyebrow: string; title: string; titleEm: string; subtitle: string };
  sections: GuideSection[];
  /** Medical / safety caveat shown in a highlighted note. */
  caveat?: string;
  faqs?: QA[];
};

export type GuideKey = "process" | "preparation" | "aftercare";

export type FaqGroup = { title: string; items: QA[] };

export type FaqPageCopy = {
  seoTitle: string;
  seoDescription: string;
  hero: { eyebrow: string; title: string; titleEm: string; subtitle: string };
  groups: FaqGroup[];
};
