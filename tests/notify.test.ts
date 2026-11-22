import assert from "node:assert/strict";
import { createECDH } from "node:crypto";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { encryptPayload, isAllowedEndpoint } from "../src/lib/push/webpush.ts";
import {
  addNotification,
  badgeCount,
  deliverPushes,
  dismiss,
  listNotifications,
  markRead,
  parseSubscription,
  saveSubscription,
  syncNotifications,
  unreadCount,
  type Sender,
} from "../src/lib/notify/service.ts";
import { appointments, customers, inquiries, notifications, outbox, pushSubscriptions, users } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

describe("web push crypto", () => {
  test("RFC 8291 appendix A test vector", () => {
    const as = createECDH("prime256v1");
    as.setPrivateKey(Buffer.from("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw", "base64url"));
    const out = encryptPayload(
      Buffer.from("When I grow up, I want to be a watermelon"),
      "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
      "BTBZMqHH6r4Tts7J_aSIgg",
      { salt: Buffer.from("DGv6ra1nlYgDCS1FRnbzlw", "base64url"), serverKey: as },
    );
    assert.equal(
      out.toString("base64url"),
      "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
    );
  });

  test("only real push services are accepted as endpoints", () => {
    assert.ok(isAllowedEndpoint("https://web.push.apple.com/QGx"));
    assert.ok(isAllowedEndpoint("https://fcm.googleapis.com/fcm/send/abc"));
    assert.ok(!isAllowedEndpoint("http://web.push.apple.com/x"));
    assert.ok(!isAllowedEndpoint("https://evil.example/web.push.apple.com"));
    assert.ok(!isAllowedEndpoint("https://127.0.0.1/x"));
    assert.ok(!isAllowedEndpoint("https://fcm.googleapis.com:8443/x"));
  });

  test("subscriptions with wrong keys are refused", () => {
    const ua = createECDH("prime256v1");
    ua.generateKeys();
    const good = { endpoint: "https://web.push.apple.com/x", keys: { p256dh: ua.getPublicKey().toString("base64url"), auth: Buffer.alloc(16, 1).toString("base64url") } };
    assert.ok(parseSubscription(good));
    assert.equal(parseSubscription({ ...good, keys: { ...good.keys, auth: "short" } }), null);
    assert.equal(parseSubscription({ ...good, endpoint: "https://attacker.test/x" }), null);
  });
});

describe("notifications against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  const sub = () => {
    const ua = createECDH("prime256v1");
    ua.generateKeys();
    return { endpoint: `https://web.push.apple.com/${Math.random().toString(36).slice(2)}`, keys: { p256dh: ua.getPublicKey().toString("base64url"), auth: Buffer.alloc(16, 7).toString("base64url") } };
  };
  async function request() {
    const [c] = (await db.insert(customers).values({ firstName: "Test", lastName: "Klant", email: `t${Math.random()}@example.test` })) as unknown as [{ insertId: number }];
    const [a] = (await db.insert(appointments).values({ customerId: c.insertId, status: "requested", source: "request" })) as unknown as [{ insertId: number }];
    return a.insertId;
  }

  beforeEach(async () => {
    db = await resetDb();
    await db.insert(users).values({ email: "hello@glowbydilek.nl", name: "Dilek", role: "owner" });
  });

  test("a new request creates one actionable notification; the badge counts it until it is handled", async () => {
    const id = await request();
    await syncNotifications(db);
    await syncNotifications(db); // idempotent
    assert.equal(await badgeCount(db), 1);
    const [n] = await listNotifications(db, "actie");
    assert.equal(n.title, "Nieuwe afspraakaanvraag");
    assert.equal(n.url, `/agenda/afspraak/${id}`);
    assert.ok(!/Test|Klant/.test(n.title + n.body), "no customer name on the lock screen");

    // Reading it does NOT clear the action.
    await markRead(db, "all");
    assert.equal(await badgeCount(db), 1);
    assert.equal(await unreadCount(db), 0);

    // Handling the request (confirm or decline, from any screen) resolves it.
    await db.update(appointments).set({ status: "confirmed" }).where(eq(appointments.id, id));
    await syncNotifications(db);
    assert.equal(await badgeCount(db), 0);
    assert.equal((await listNotifications(db, "afgehandeld")).length, 1);
  });

  test("several pending items give the exact count; messages count until answered or closed", async () => {
    await request();
    await request();
    const [q] = (await db.insert(inquiries).values({ name: "A", email: "a@example.test", topic: "other", message: "Vraag", locale: "nl", consentAt: new Date() })) as unknown as [{ insertId: number }];
    await syncNotifications(db);
    assert.equal(await badgeCount(db), 3);
    await db.update(inquiries).set({ status: "read" }).where(eq(inquiries.id, q.insertId));
    await syncNotifications(db);
    assert.equal(await badgeCount(db), 3, "opening a message is not handling it");
    await db.update(inquiries).set({ status: "replied" }).where(eq(inquiries.id, q.insertId));
    await syncNotifications(db);
    assert.equal(await badgeCount(db), 2);
  });

  test("a failed invoice email becomes an action that opens the invoice", async () => {
    await db.insert(outbox).values({ dedupeKey: "inv:9", kind: "invoice", toEmail: "k@example.test", subject: "Factuur", html: "x", textBody: "x", attachmentKind: "invoice", attachmentRef: 9, status: "failed" });
    await syncNotifications(db);
    const [n] = await listNotifications(db, "actie");
    assert.equal(n.title, "Factuur niet verzonden");
    assert.equal(n.url, "/agenda/facturen/9");
  });

  test("one push per device, the payload carries the badge, no duplicate pushes", async () => {
    const [{ id: userId }] = await db.select({ id: users.id }).from(users);
    await saveSubscription(db, userId, sub(), "iPhone · Safari");
    await saveSubscription(db, userId, sub(), "iPad · Safari");
    await request();
    await syncNotifications(db);
    const calls: { endpoint: string; payload: { badge: number; title: string } }[] = [];
    const send: Sender = async (t, p) => {
      calls.push({ endpoint: t.endpoint, payload: p as { badge: number; title: string } });
      return { ok: true, status: 201 };
    };
    await deliverPushes(db, send);
    await deliverPushes(db, send);
    assert.equal(calls.length, 2, "two devices, one notification");
    assert.ok(calls.every((c) => c.payload.badge === 1 && c.payload.title === "Nieuwe afspraakaanvraag"));
    assert.equal(await badgeCount(db), 1, "two devices never count the same task twice");
  });

  test("an expired subscription is switched off; temporary errors are retried", async () => {
    const [{ id: userId }] = await db.select({ id: users.id }).from(users);
    await saveSubscription(db, userId, sub(), "Old phone");
    await request();
    await syncNotifications(db);
    await deliverPushes(db, async () => ({ ok: false, status: 410, gone: true, retry: false }));
    const [s] = await db.select().from(pushSubscriptions);
    assert.ok(s.disabledAt, "gone subscription disabled");

    await saveSubscription(db, userId, sub(), "Phone");
    await request();
    await syncNotifications(db);
    await deliverPushes(db, async () => ({ ok: false, status: 503, gone: false, retry: true }));
    const pending = await db.select().from(notifications).where(eq(notifications.pushStatus, "pending"));
    assert.equal(pending.length, 1, "kept for retry");
    await deliverPushes(db, async () => ({ ok: true, status: 201 }));
    assert.equal((await db.select().from(notifications).where(eq(notifications.pushStatus, "pending"))).length, 0);
  });

  test("items already waiting before the first start are listed but not pushed", async () => {
    const id = await request();
    await db.update(appointments).set({ createdAt: new Date(Date.now() - 3 * 3600_000) }).where(eq(appointments.id, id));
    await syncNotifications(db);
    const [n] = await db.select().from(notifications);
    assert.equal(n.pushStatus, "skipped");
    assert.equal(await badgeCount(db), 1);
  });

  test("informational notifications can be dismissed; actions cannot", async () => {
    await addNotification(db, { dedupeKey: "info:1", kind: "info", category: "systeem", title: "Info", url: "/agenda", actionable: false });
    await request();
    await syncNotifications(db);
    const rows = await listNotifications(db, "alle");
    const info = rows.find((r) => r.kind === "info")!;
    const act = rows.find((r) => r.actionable)!;
    assert.equal(await dismiss(db, info.id), true);
    assert.equal(await dismiss(db, act.id), false);
    assert.equal(await badgeCount(db), 1);
  });

  test("disabled or non-owner accounts get no pushes", async () => {
    const [{ id: userId }] = await db.select({ id: users.id }).from(users);
    await saveSubscription(db, userId, sub(), "Phone");
    await db.update(users).set({ disabled: true }).where(eq(users.id, userId));
    await request();
    await syncNotifications(db);
    let calls = 0;
    await deliverPushes(db, async () => {
      calls++;
      return { ok: true, status: 201 };
    });
    assert.equal(calls, 0);
  });
});
