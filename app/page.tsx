import { redirect } from "next/navigation";

import { requireAuth } from "@/modules/auth/actions";

export const instant = false;

export default async function Home() {
  await requireAuth();
  redirect("/agents");
}
