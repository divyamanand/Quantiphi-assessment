import express from "express";
import cors from "cors";
import subscriptionsRouter from "./routes/subscriptions.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/subscriptions", subscriptionsRouter);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.use(errorHandler);

export default app;
