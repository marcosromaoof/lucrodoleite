import { NextResponse } from "next/server";

export type ApiError = {
  code: string;
  details?: unknown;
  message: string;
};

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data, error: null }, { status });
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      data: null,
      error: {
        code,
        details,
        message,
      } satisfies ApiError,
    },
    { status },
  );
}

export function zodError(details: unknown) {
  return apiError(400, "validation_error", "Payload invalido.", details);
}
