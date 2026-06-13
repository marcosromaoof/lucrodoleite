export type ActionState =
  | {
      ok: true;
      message: string;
      id?: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export function validationError(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return {
    ok: false,
    message,
    fieldErrors,
  };
}

export function success(message: string, id?: string): ActionState {
  return {
    ok: true,
    message,
    id,
  };
}
