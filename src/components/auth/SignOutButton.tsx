"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
      title="ログアウト"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">ログアウト</span>
    </button>
  );
}
