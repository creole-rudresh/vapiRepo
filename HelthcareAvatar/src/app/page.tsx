"use client";

import { useState } from "react";
import WelcomeLanding from "@/components/WelcomeLanding";
import CallScreen from "@/components/CallScreen";

type PageState = "landing" | "call";

export default function Home() {
  const [pageState, setPageState] = useState<PageState>("landing");

  return (
    <>
      {pageState === "landing" && (
        <WelcomeLanding onStartCall={() => setPageState("call")} />
      )}

      {pageState === "call" && (
        <CallScreen onBack={() => setPageState("landing")} />
      )}
    </>
  );
}
