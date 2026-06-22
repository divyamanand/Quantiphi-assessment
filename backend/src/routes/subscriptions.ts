import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { enrichSubscription, computeMetrics } from "../lib/metrics.js";

const router = Router();

const VALID_CYCLES = ["Monthly", "Yearly"];

function validateBody(body: Record<string, unknown>): string[] {
  const { serviceName, cost, billingCycle, nextRenewalDate } = body;
  const errors: string[] = [];

  if (!serviceName || typeof serviceName !== "string" || !serviceName.trim()) {
    errors.push("serviceName is required");
  }
  if (cost === undefined || cost === null || isNaN(Number(cost)) || Number(cost) <= 0) {
    errors.push("cost must be a positive number");
  }
  if (!VALID_CYCLES.includes(billingCycle as string)) {
    errors.push(`billingCycle must be one of: ${VALID_CYCLES.join(", ")}`);
  }
  if (!nextRenewalDate || isNaN(Date.parse(nextRenewalDate as string))) {
    errors.push("nextRenewalDate must be a valid date (YYYY-MM-DD)");
  }

  return errors;
}

// GET /subscriptions/metrics — must be before /:id routes
router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const subs = await prisma.subscription.findMany();
    res.json(computeMetrics(subs));
  } catch {
    res.status(500).json({ error: "Failed to compute metrics" });
  }
});

// GET /subscriptions
router.get("/", async (_req: Request, res: Response) => {
  try {
    const subs = await prisma.subscription.findMany({ orderBy: { createdAt: "desc" } });
    res.json(subs.map(enrichSubscription));
  } catch {
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// POST /subscriptions
router.post("/", async (req: Request, res: Response) => {
  const errors = validateBody(req.body as Record<string, unknown>);
  if (errors.length) {
    res.status(400).json({ errors });
    return;
  }

  const { serviceName, cost, billingCycle, nextRenewalDate } = req.body as {
    serviceName: string;
    cost: number;
    billingCycle: string;
    nextRenewalDate: string;
  };

  try {
    const sub = await prisma.subscription.create({
      data: {
        serviceName: serviceName.trim(),
        cost: Number(cost),
        billingCycle,
        nextRenewalDate,
        status: "Active",
      },
    });
    res.status(201).json(enrichSubscription(sub));
  } catch {
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// PATCH /subscriptions/:id/toggle
router.patch("/:id/toggle", async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    const newStatus = existing.status === "Active" ? "Paused" : "Active";
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: newStatus },
    });
    res.json(enrichSubscription(updated));
  } catch {
    res.status(500).json({ error: "Failed to toggle subscription" });
  }
});

// DELETE /subscriptions/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    await prisma.subscription.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});

export default router;
