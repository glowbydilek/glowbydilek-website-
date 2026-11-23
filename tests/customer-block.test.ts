import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { isBlockedContact, setCustomerBlocked } from "../src/lib/crm/service.ts";
import { customers } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

describe("customer blocking", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  beforeEach(async () => {
    db = await resetDb();
  });

  async function addCustomer() {
    const [r] = (await db.insert(customers).values({ firstName: "Test", lastName: "Klant", email: "test@example.com", emailNorm: "test@example.com", phone: "06 12345678", phoneNorm: "+31612345678" })) as unknown as [{ insertId: number }];
    return r.insertId;
  }

  test("a blocked email or phone is recognised in any notation; unblocking lifts it", async () => {
    const id = await addCustomer();
    assert.equal(await isBlockedContact(db, { email: "TEST@example.com" }), false);
    await setCustomerBlocked(db, id, true, "  herhaaldelijk niet verschenen  ", { userId: null });
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    assert.ok(c.blockedAt);
    assert.equal(c.blockReason, "herhaaldelijk niet verschenen");
    assert.equal(await isBlockedContact(db, { email: " Test@Example.com " }), true);
    assert.equal(await isBlockedContact(db, { phone: "+31 6 1234 5678" }), true);
    assert.equal(await isBlockedContact(db, { email: "other@example.com", phone: "0687654321" }), false);
    assert.equal(await isBlockedContact(db, {}), false);
    await setCustomerBlocked(db, id, false, "ignored", { userId: null });
    const [u] = await db.select().from(customers).where(eq(customers.id, id));
    assert.equal(u.blockedAt, null);
    assert.equal(u.blockReason, null);
    assert.equal(await isBlockedContact(db, { email: "test@example.com" }), false);
  });

  test("an anonymised profile never blocks anyone", async () => {
    const id = await addCustomer();
    await setCustomerBlocked(db, id, true, null, { userId: null });
    await db.update(customers).set({ anonymizedAt: new Date() }).where(eq(customers.id, id));
    assert.equal(await isBlockedContact(db, { email: "test@example.com" }), false);
    await assert.rejects(setCustomerBlocked(db, id, false, null, { userId: null }));
  });
});
