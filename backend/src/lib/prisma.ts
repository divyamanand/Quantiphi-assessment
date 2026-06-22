import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });

const prisma = new PrismaClient({ adapter });

export default prisma;
