"use client";

import { OutBox } from "./components/OutBox";
import { AgentBridge } from "./components/AgentBridge";

export default function Home() {
  return (
    <AgentBridge>
      <main className="min-h-screen bg-[#090a0f] text-[#f3f4f6] relative overflow-x-hidden flex flex-col items-center justify-start pb-20">
        <div className="w-full relative z-10">
          <OutBox />
        </div>
      </main>
    </AgentBridge>
  );
}
