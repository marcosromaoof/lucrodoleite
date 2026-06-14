import { auth } from "@/auth";
import { isAuthConfigured } from "@/lib/app/environment";

export async function getOptionalSession() {
  if (!isAuthConfigured()) {
    return null;
  }

  try {
    return await auth();
  } catch {
    return null;
  }
}
