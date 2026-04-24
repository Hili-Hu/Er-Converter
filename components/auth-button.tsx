"use client";
import { SignInButton, SignOutButton, UserButton, useUser } from "@clerk/nextjs";

export function AuthButton() {
  const { isSignedIn } = useUser();
  return (
    <div className="fixed top-4 right-4 z-50">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <SignInButton mode="modal">
          <button className="text-[10px] tracking-widest border border-[#555] px-4 py-2 text-[#f5f5f5] hover:border-white transition-colors bg-black/80">
            登录
          </button>
        </SignInButton>
      )}
    </div>
  );
}
