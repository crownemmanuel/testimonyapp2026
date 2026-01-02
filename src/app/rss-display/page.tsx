"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { subscribeToLiveTestimony } from "@/lib/firebase";
import { LiveTestimony } from "@/lib/types";

export default function RSSDisplayPage() {
  const [liveTestimony, setLiveTestimony] = useState<LiveTestimony | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToLiveTestimony((live) => {
      setLiveTestimony(live);
      setIsConnected(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-white/50 hover:text-white transition-colors text-sm"
        >
          ← Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-white/50 text-sm">
            {isConnected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        {liveTestimony ? (
          <div className="text-center animate-fade-in">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight">
              {liveTestimony.displayName}
            </h1>
            <div className="mt-8 flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-400 text-lg uppercase tracking-wider">
                Live
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white/30 text-2xl">Waiting for testimony...</p>
          </div>
        )}
      </main>

      <footer className="p-4">
        <div className="text-center text-white/20 text-sm">
          <p>
            RSS Feed:{" "}
            {typeof window !== "undefined"
              ? `${window.location.origin}/rss`
              : "/rss"}
          </p>
        </div>
      </footer>
    </div>
  );
}
