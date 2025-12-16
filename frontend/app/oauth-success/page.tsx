"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function decodeJwt(token: string) {
  const base64 = token.split(".")[1];
  return JSON.parse(atob(base64));
}

export default function OAuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      router.push("/signin");
      return;
    }

    const decoded = decodeJwt(token);

    localStorage.setItem("token", token);
    localStorage.setItem(
      "user",
      JSON.stringify({ 
          email: decoded.sub, 
          name: decoded.name,
          subscription_status: decoded.subscription_status // NOW PRESENT
      })
    );

    router.push("/");
  }, [router]);

  return null;
}
