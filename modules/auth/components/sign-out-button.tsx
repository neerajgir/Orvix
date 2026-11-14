"use client";

import { signOut } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";

export function SignOutButton({
  className,
  variant = "ghost",
  children = "Sign out",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  children?: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => signOut()}
    >
      <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
      {children}
    </Button>
  );
}
