"use server";

import { signIn } from "@/auth";

export async function signInWithGoogleAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  const redirectTo = getSafeRedirect(typeof callbackUrl === "string" ? callbackUrl : "/painel");

  await signIn("google", { redirectTo });
}

function getSafeRedirect(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/painel";
}
