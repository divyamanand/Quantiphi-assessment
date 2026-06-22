import request from "supertest";

// ── in-memory DB mock (avoids Prisma ESM/CJS clash in Jest) ─────────────────
interface SubRecord {
  id: number;
  serviceName: string;
  cost: number;
  billingCycle: string;
  nextRenewalDate: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const db = new Map<number, SubRecord>();
let nextId = 1;

const prismaMock = {
  subscription: {
    findMany: jest.fn(async (_args?: unknown) =>
      [...db.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    ),
    findUnique: jest.fn(async ({ where }: { where: { id: number } }) =>
      db.get(where.id) ?? null
    ),
    create: jest.fn(async ({ data }: { data: Omit<SubRecord, "id" | "createdAt" | "updatedAt"> }) => {
      const now = new Date();
      const sub: SubRecord = { ...data, id: nextId++, createdAt: now, updatedAt: now };
      db.set(sub.id, sub);
      return sub;
    }),
    update: jest.fn(async ({ where, data }: { where: { id: number }; data: Partial<SubRecord> }) => {
      const existing = db.get(where.id)!;
      const sub = { ...existing, ...data, updatedAt: new Date() };
      db.set(where.id, sub);
      return sub;
    }),
    delete: jest.fn(async ({ where }: { where: { id: number } }) => {
      const sub = db.get(where.id)!;
      db.delete(where.id);
      return sub;
    }),
    deleteMany: jest.fn(async () => {
      db.clear();
      return { count: 0 };
    }),
  },
};

jest.mock("../src/lib/prisma", () => ({ default: prismaMock, __esModule: true }));

// eslint-disable-next-line import/first
import app from "../src/app";

// ── helpers ──────────────────────────────────────────────────────────────────
const dateIn = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0] as string;
};

const validMonthly = () => ({
  serviceName: "Netflix",
  cost: 15.99,
  billingCycle: "Monthly",
  nextRenewalDate: dateIn(30),
});

const validYearly = () => ({
  serviceName: "Spotify",
  cost: 120,
  billingCycle: "Yearly",
  nextRenewalDate: dateIn(60),
});

// ── lifecycle ────────────────────────────────────────────────────────────────
beforeEach(() => {
  db.clear();
  nextId = 1;
  jest.clearAllMocks();
  // re-bind mocks so cleared state is used
  prismaMock.subscription.findMany.mockImplementation(async () =>
    [...db.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );
  prismaMock.subscription.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) =>
    db.get(where.id) ?? null
  );
  prismaMock.subscription.create.mockImplementation(async ({ data }: { data: Omit<SubRecord, "id" | "createdAt" | "updatedAt"> }) => {
    const now = new Date();
    const sub: SubRecord = { ...data, id: nextId++, createdAt: now, updatedAt: now };
    db.set(sub.id, sub);
    return sub;
  });
  prismaMock.subscription.update.mockImplementation(async ({ where, data }: { where: { id: number }; data: Partial<SubRecord> }) => {
    const existing = db.get(where.id)!;
    const sub = { ...existing, ...data, updatedAt: new Date() };
    db.set(where.id, sub);
    return sub;
  });
  prismaMock.subscription.delete.mockImplementation(async ({ where }: { where: { id: number } }) => {
    const sub = db.get(where.id)!;
    db.delete(where.id);
    return sub;
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /subscriptions
// ══════════════════════════════════════════════════════════════════════════════
describe("POST /subscriptions", () => {
  test("TC-01 valid monthly subscription returns 201 with correct monthlyRate", async () => {
    const res = await request(app).post("/subscriptions").send(validMonthly());
    expect(res.status).toBe(201);
    expect(res.body.serviceName).toBe("Netflix");
    expect(res.body.billingCycle).toBe("Monthly");
    expect(res.body.monthlyRate).toBe(15.99);
    expect(res.body.status).toBe("Active");
  });

  test("TC-02 valid yearly subscription returns 201 with monthlyRate = cost / 12", async () => {
    const res = await request(app).post("/subscriptions").send(validYearly());
    expect(res.status).toBe(201);
    expect(res.body.monthlyRate).toBe(10);
  });

  test("TC-03 missing serviceName returns 400 with validation error", async () => {
    const { serviceName: _omit, ...body } = validMonthly();
    const res = await request(app).post("/subscriptions").send(body);
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("serviceName")])
    );
  });

  test("TC-04 cost = 0 returns 400", async () => {
    const res = await request(app).post("/subscriptions").send({ ...validMonthly(), cost: 0 });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("cost")])
    );
  });

  test("TC-05 negative cost returns 400", async () => {
    const res = await request(app).post("/subscriptions").send({ ...validMonthly(), cost: -5 });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("cost")])
    );
  });

  test("TC-06 invalid billingCycle returns 400", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), billingCycle: "Weekly" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("billingCycle")])
    );
  });

  test("TC-07 invalid date string returns 400", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: "not-a-date" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("nextRenewalDate")])
    );
  });

  test("TC-08 renewal within 7 days sets renewingSoon=true", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(3) });
    expect(res.status).toBe(201);
    expect(res.body.renewingSoon).toBe(true);
    expect(res.body.daysUntilRenewal).toBe(3);
  });

  test("TC-09 renewal beyond 7 days sets renewingSoon=false", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(30) });
    expect(res.status).toBe(201);
    expect(res.body.renewingSoon).toBe(false);
  });

  test("TC-10 newly created subscription defaults to Active status", async () => {
    const res = await request(app).post("/subscriptions").send(validMonthly());
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Active");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /subscriptions
// ══════════════════════════════════════════════════════════════════════════════
describe("GET /subscriptions", () => {
  test("TC-11 returns array with enriched fields on each item", async () => {
    await request(app).post("/subscriptions").send(validMonthly());
    const res = await request(app).get("/subscriptions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const sub = res.body[0];
    expect(sub).toHaveProperty("monthlyRate");
    expect(sub).toHaveProperty("daysUntilRenewal");
    expect(sub).toHaveProperty("renewingSoon");
  });

  test("TC-12 returns empty array when no subscriptions exist", async () => {
    const res = await request(app).get("/subscriptions");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /subscriptions/metrics
// ══════════════════════════════════════════════════════════════════════════════
describe("GET /subscriptions/metrics", () => {
  test("TC-13 all active: totalMonthlyBurn = sum of normalized costs", async () => {
    await request(app).post("/subscriptions").send(validMonthly()); // $15.99/mo
    await request(app).post("/subscriptions").send(validYearly());  // $10.00/mo
    const res = await request(app).get("/subscriptions/metrics");
    expect(res.status).toBe(200);
    expect(res.body.totalMonthlyBurn).toBe(25.99);
  });

  test("TC-14 paused subscription excluded from totalMonthlyBurn", async () => {
    const post = await request(app).post("/subscriptions").send(validMonthly());
    await request(app).post("/subscriptions").send(validYearly());
    await request(app).patch(`/subscriptions/${post.body.id}/toggle`); // pause Netflix
    const res = await request(app).get("/subscriptions/metrics");
    expect(res.body.totalMonthlyBurn).toBe(10);
  });

  test("TC-15 all paused: totalMonthlyBurn=0 and upcomingRenewalsCount=0", async () => {
    const a = await request(app).post("/subscriptions").send(validMonthly());
    const b = await request(app).post("/subscriptions").send(validYearly());
    await request(app).patch(`/subscriptions/${a.body.id}/toggle`);
    await request(app).patch(`/subscriptions/${b.body.id}/toggle`);
    const res = await request(app).get("/subscriptions/metrics");
    expect(res.body.totalMonthlyBurn).toBe(0);
    expect(res.body.upcomingRenewalsCount).toBe(0);
  });

  test("TC-16 active sub renewing in 3 days increments upcomingRenewalsCount", async () => {
    await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(3) });
    const res = await request(app).get("/subscriptions/metrics");
    expect(res.body.upcomingRenewalsCount).toBe(1);
  });

  test("TC-17 paused sub renewing soon is NOT counted in upcomingRenewalsCount", async () => {
    const post = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(3) });
    await request(app).patch(`/subscriptions/${post.body.id}/toggle`); // pause it
    const res = await request(app).get("/subscriptions/metrics");
    expect(res.body.upcomingRenewalsCount).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /subscriptions/:id/toggle
// ══════════════════════════════════════════════════════════════════════════════
describe("PATCH /subscriptions/:id/toggle", () => {
  test("TC-18 Active → Paused", async () => {
    const post = await request(app).post("/subscriptions").send(validMonthly());
    const res = await request(app).patch(`/subscriptions/${post.body.id}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Paused");
  });

  test("TC-19 Paused → Active", async () => {
    const post = await request(app).post("/subscriptions").send(validMonthly());
    await request(app).patch(`/subscriptions/${post.body.id}/toggle`); // → Paused
    const res = await request(app).patch(`/subscriptions/${post.body.id}/toggle`); // → Active
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Active");
  });

  test("TC-20 non-existent ID returns 404", async () => {
    const res = await request(app).patch("/subscriptions/99999/toggle");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Subscription not found");
  });

  test("TC-21 non-numeric ID returns 400", async () => {
    const res = await request(app).patch("/subscriptions/abc/toggle");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid id");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /subscriptions/:id
// ══════════════════════════════════════════════════════════════════════════════
describe("DELETE /subscriptions/:id", () => {
  test("TC-22 valid delete returns 204 with no body", async () => {
    const post = await request(app).post("/subscriptions").send(validMonthly());
    const res = await request(app).delete(`/subscriptions/${post.body.id}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  test("TC-23 non-existent ID returns 404", async () => {
    const res = await request(app).delete("/subscriptions/99999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Subscription not found");
  });

  test("TC-24 non-numeric ID returns 400", async () => {
    const res = await request(app).delete("/subscriptions/abc");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid id");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Cost Uniformity Engine
// ══════════════════════════════════════════════════════════════════════════════
describe("Cost Uniformity Engine", () => {
  test("TC-25 yearly $120 normalizes to monthlyRate $10.00", async () => {
    const res = await request(app).post("/subscriptions").send({ ...validYearly(), cost: 120 });
    expect(res.body.monthlyRate).toBe(10);
  });

  test("TC-26 monthly $9.99 stays as monthlyRate $9.99", async () => {
    const res = await request(app).post("/subscriptions").send({ ...validMonthly(), cost: 9.99 });
    expect(res.body.monthlyRate).toBe(9.99);
  });

  test("TC-27 yearly $100 rounds to 2dp: $8.33", async () => {
    const res = await request(app).post("/subscriptions").send({ ...validYearly(), cost: 100 });
    expect(res.body.monthlyRate).toBe(8.33);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Date Intersect Calculator
// ══════════════════════════════════════════════════════════════════════════════
describe("Date Intersect Calculator", () => {
  test("TC-28 renewal in 3 days: renewingSoon=true, daysUntilRenewal=3", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(3) });
    expect(res.body.renewingSoon).toBe(true);
    expect(res.body.daysUntilRenewal).toBe(3);
  });

  test("TC-29 renewal in exactly 7 days: renewingSoon=true (boundary)", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(7) });
    expect(res.body.renewingSoon).toBe(true);
  });

  test("TC-30 renewal in 8 days: renewingSoon=false", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(8) });
    expect(res.body.renewingSoon).toBe(false);
  });

  test("TC-31 renewal today: renewingSoon=true, daysUntilRenewal=0", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(0) });
    expect(res.body.renewingSoon).toBe(true);
    expect(res.body.daysUntilRenewal).toBe(0);
  });

  test("TC-32 past renewal date returns 400 with validation error", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .send({ ...validMonthly(), nextRenewalDate: dateIn(-1) });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("future")])
    );
  });
});
