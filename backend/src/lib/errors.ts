export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (msg = "Subscription not found"): AppError =>
  new AppError(404, msg, "NOT_FOUND");

export const badRequest = (msg: string): AppError =>
  new AppError(400, msg, "BAD_REQUEST");

export function prismaError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  if (isPrismaKnown(e)) {
    if (e.code === "P2025") return notFound();
    if (e.code === "P2002")
      return new AppError(409, "A record with that value already exists", "CONFLICT");
  }
  return new AppError(500, "An unexpected error occurred", "INTERNAL_ERROR");
}

function isPrismaKnown(e: unknown): e is { code: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
  );
}
