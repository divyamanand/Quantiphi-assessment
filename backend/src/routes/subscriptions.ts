import { Router, type Request, type Response, type NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { enrichSubscription, computeMetrics } from "../lib/metrics.js";
import { notFound, badRequest, prismaError } from "../lib/errors.js";

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
  } else {
    const renewal = new Date(nextRenewalDate as string);
    renewal.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (renewal < today) {
      errors.push("nextRenewalDate must be today or in the future");
    }
  }

  return errors;
}

// GET /subscriptions/metrics — must be before /:id routes
router.get("/metrics", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subs = await prisma.subscription.findMany();
    res.json(computeMetrics(subs));
  } catch (err) {
    next(prismaError(err));
  }
});

// GET /subscriptions
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subs = await prisma.subscription.findMany({ orderBy: { createdAt: "desc" } });
    res.json(subs.map(enrichSubscription));
  } catch (err) {
    next(prismaError(err));
  }
});

// POST /subscriptions
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const errors = validateBody(req.body as Record<string, unknown>);
  if (errors.length) {
    res.status(400).json({ errors, code: "VALIDATION_ERROR" });
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
  } catch (err) {
    next(prismaError(err));
  }
});

// PATCH /subscriptions/:id/toggle
router.patch("/:id/toggle", async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    return next(badRequest("Invalid id"));
  }

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) {
      return next(notFound());
    }

    const newStatus = existing.status === "Active" ? "Paused" : "Active";
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: newStatus },
    });
    res.json(enrichSubscription(updated));
  } catch (err) {
    next(prismaError(err));
  }
});

// DELETE /subscriptions/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    return next(badRequest("Invalid id"));
  }

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) {
      return next(notFound());
    }

    await prisma.subscription.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(prismaError(err));
  }
});

export default router;
