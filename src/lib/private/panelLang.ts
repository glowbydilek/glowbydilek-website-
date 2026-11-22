/**
 * Language of the private panel (/agenda and /admin): Dutch (default) or
 * Turkish. The public website keeps its own languages; this only affects the
 * interface Dilek works in. Stored customer data is never translated.
 *
 * The choice lives in a long-lived cookie on the device, so it survives
 * logout, login and reopening the installed Agenda app.
 */
export type PanelLang = "nl" | "tr";
export const PANEL_LANG_COOKIE = "glow-panel-lang";
export const PANEL_LANGS: PanelLang[] = ["nl", "tr"];

export function toPanelLang(v: string | undefined | null): PanelLang {
  return v === "tr" ? "tr" : "nl";
}

/** BCP-47 locale for dates and numbers (times stay in Europe/Amsterdam). */
export const panelLocale = (lang: PanelLang) => (lang === "tr" ? "tr-NL" : "nl-NL");

const dict = {
  nl: {
    // navigation (by route)
    "/agenda": "Vandaag",
    "/agenda/kalender": "Kalender",
    "/agenda/aanvragen": "Aanvragen",
    "/agenda/afspraak/nieuw": "Nieuwe afspraak",
    "/agenda/klanten": "Klanten",
    "/agenda/intake": "Intakeformulier",
    "/agenda/financien": "Financiën",
    "/agenda/facturen": "Facturen & PDF",
    "/agenda/uitgaven": "Uitgaven",
    "/agenda/berichten": "Berichten",
    "/agenda/historie": "Overzichten",
    "/agenda/werktijden": "Werktijden",
    "/agenda/instellingen": "Instellingen",
    "/admin/behandelingen": "Behandelingen & prijzen",
    "/admin/beveiliging": "Mijn account",
    "/admin": "Overzicht",
    "/admin/paginas": "Pagina's",
    "/admin/thema": "Thema & Design",
    "/admin/navigatie": "Menu & footer",
    "/admin/media": "Media",
    "/admin/over-dilek": "Over Dilek (opleiding)",
    "/admin/producten": "Producten & materialen",
    "/admin/acties": "Acties & kortingen",
    "/admin/beoordelingen": "Beoordelingen",
    "/admin/social": "Social media",
    "/admin/seo": "SEO & doorverwijzingen",
    "/admin/analytics": "Analytics & cookies",
    "/admin/e-mails": "E-mailteksten",
    "/admin/bedrijf": "Bedrijf & facturen",
    "/admin/privacy": "Privacy & consultatie",
    "/admin/juridisch": "Juridische pagina's",
    "/admin/medewerkers": "Medewerkers & rechten",
    "/admin/systeem": "Systeem & logboek",
    // short labels for the phone tab bar
    "tab:/agenda/afspraak/nieuw": "Nieuw",
    "tab:/agenda/intake": "Intake",
    // shell
    toAgenda: "Naar Agenda",
    toAdmin: "Naar Admin",
    toAgendaLong: "Naar de agenda",
    viewSite: "Website bekijken",
    logout: "Uitloggen",
    menu: "Menu",
    close: "Sluiten",
    quickMenu: "Snelmenu",
    language: "Taal",
    titleAdmin: "Admin Glow by Dilek",
    titleAgenda: "Glow by Dilek — Agenda",
  },
  tr: {
    "/agenda": "Bugün",
    "/agenda/kalender": "Takvim",
    "/agenda/aanvragen": "Talepler",
    "/agenda/afspraak/nieuw": "Yeni randevu",
    "/agenda/klanten": "Müşteriler",
    "/agenda/intake": "Ön bilgi formu",
    "/agenda/financien": "Finans",
    "/agenda/facturen": "Faturalar ve PDF",
    "/agenda/uitgaven": "Giderler",
    "/agenda/berichten": "Mesajlar",
    "/agenda/historie": "Raporlar",
    "/agenda/werktijden": "Çalışma saatleri",
    "/agenda/instellingen": "Ayarlar",
    "/admin/behandelingen": "İşlemler ve Fiyatlar",
    "/admin/beveiliging": "Hesabım",
    "/admin": "Genel bakış",
    "/admin/paginas": "Sayfalar",
    "/admin/thema": "Tema ve tasarım",
    "/admin/navigatie": "Menü ve alt bilgi",
    "/admin/media": "Medya",
    "/admin/over-dilek": "Dilek hakkında (eğitim)",
    "/admin/producten": "Ürünler ve malzemeler",
    "/admin/acties": "Kampanyalar ve indirimler",
    "/admin/beoordelingen": "Yorumlar",
    "/admin/social": "Sosyal medya",
    "/admin/seo": "SEO ve yönlendirmeler",
    "/admin/analytics": "Analytics ve çerezler",
    "/admin/e-mails": "E-posta metinleri",
    "/admin/bedrijf": "İşletme ve faturalar",
    "/admin/privacy": "Gizlilik ve danışma",
    "/admin/juridisch": "Yasal sayfalar",
    "/admin/medewerkers": "Çalışanlar ve yetkiler",
    "/admin/systeem": "Sistem ve kayıtlar",
    "tab:/agenda/afspraak/nieuw": "Yeni",
    "tab:/agenda/intake": "Form",
    toAgenda: "Ajandaya git",
    toAdmin: "Yönetime git",
    toAgendaLong: "Ajandaya git",
    viewSite: "Web sitesini gör",
    logout: "Çıkış yap",
    menu: "Menü",
    close: "Kapat",
    quickMenu: "Hızlı menü",
    language: "Dil",
    titleAdmin: "Glow by Dilek Yönetim",
    titleAgenda: "Glow by Dilek — Ajanda",
  },
} as const;

export type PanelKey = keyof (typeof dict)["nl"];

/** Translate a panel string; unknown keys fall back to Dutch, then to the key. */
export function pt(lang: PanelLang, key: string, fallback?: string): string {
  const d = dict[lang] as Record<string, string>;
  return d[key] ?? (dict.nl as Record<string, string>)[key] ?? fallback ?? key;
}
