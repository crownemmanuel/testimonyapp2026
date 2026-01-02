"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PinGate from "@/components/PinGate";
import ServiceSelector from "@/components/ServiceSelector";
import DatePicker, { getTodayDate } from "@/components/DatePicker";
import {
  getTestimoniesByDateAndService,
  setLiveTestimony,
  clearLiveTestimony,
  getLiveTestimony,
} from "@/lib/firebase";
import { Testimony, LiveTestimony } from "@/lib/types";
import { formatNameForCopy } from "@/lib/nameUtils";

function MediaContent() {
  const [date, setDate] = useState(getTodayDate());
  const [service, setService] = useState("");
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLive, setCurrentLive] = useState<LiveTestimony | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadTestimonies = async () => {
    if (!service) return;
    setIsLoading(true);
    try {
      const data = await getTestimoniesByDateAndService(
        date,
        service,
        "approved"
      );
      setTestimonies(data);
    } catch (error) {
      console.error("Failed to load testimonies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentLive = async () => {
    try {
      const live = await getLiveTestimony();
      setCurrentLive(live);
    } catch (error) {
      console.error("Failed to load current live:", error);
    }
  };

  useEffect(() => {
    loadCurrentLive();
  }, []);

  useEffect(() => {
    if (service) {
      loadTestimonies();
    }
  }, [date, service]);

  const handleCopyName = async (testimony: Testimony) => {
    const formattedName = formatNameForCopy(testimony.name);
    try {
      await navigator.clipboard.writeText(formattedName);
      setCopiedId(testimony.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSetLive = async (testimony: Testimony) => {
    const formattedName = formatNameForCopy(testimony.name);
    try {
      await setLiveTestimony({
        testimonyId: testimony.id,
        displayName: formattedName,
        name: testimony.name,
        updatedAt: Date.now(),
      });
      setCurrentLive({
        testimonyId: testimony.id,
        displayName: formattedName,
        name: testimony.name,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to set live:", error);
    }
  };

  const handleClearLive = async () => {
    try {
      await clearLiveTestimony();
      setCurrentLive(null);
    } catch (error) {
      console.error("Failed to clear live:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="p-2 -ml-2 text-white/70 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white">Media View</h1>
        </header>

        {/* Current Live Indicator */}
        {currentLive && (
          <div className="bg-red-600/90 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <div>
                <p className="text-white/80 text-sm">Currently Live:</p>
                <p className="text-white font-bold text-lg">
                  {currentLive.displayName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearLive}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-white/80 text-sm mb-2">Date</label>
              <DatePicker value={date} onChange={setDate} className="w-full" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-white/80 text-sm mb-2">
                Service
              </label>
              <ServiceSelector
                value={service}
                onChange={setService}
                className="w-full"
              />
            </div>
            <button
              onClick={loadTestimonies}
              disabled={!service}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
            >
              Load
            </button>
          </div>
        </div>

        {/* RSS Feed Link */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <p className="text-white/60 text-sm mb-2">RSS Feed URL:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/30 text-cyan-400 px-3 py-2 rounded-lg text-sm overflow-x-auto">
              {typeof window !== "undefined"
                ? `${window.location.origin}/rss`
                : "/rss"}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/rss`
                );
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Testimonies List */}
        {!service ? (
          <div className="text-center py-16">
            <p className="text-white/50">
              Select a date and service to view approved testimonies
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-16">
            <p className="text-white/50">Loading...</p>
          </div>
        ) : testimonies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/50">No approved testimonies found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {testimonies.map((testimony) => {
              const isLive = currentLive?.testimonyId === testimony.id;
              const isCopied = copiedId === testimony.id;

              return (
                <div
                  key={testimony.id}
                  className={`rounded-xl p-4 flex items-center justify-between transition-all ${
                    isLive
                      ? "bg-red-600/30 border border-red-500/50"
                      : "bg-white/10 border border-white/10 hover:bg-white/15"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isLive && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                    <span className="text-white font-medium text-lg">
                      {testimony.name}
                    </span>
                    <span className="text-white/40 text-sm">
                      → {formatNameForCopy(testimony.name)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyName(testimony)}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                        isCopied
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isCopied ? "Copied!" : "Copy Name"}
                    </button>
                    <button
                      onClick={() => handleSetLive(testimony)}
                      disabled={isLive}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                        isLive
                          ? "bg-red-600 text-white cursor-default"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                    >
                      {isLive ? "Live" : "Live"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Count */}
        {testimonies.length > 0 && (
          <div className="mt-6 text-center text-white/40 text-sm">
            {testimonies.length} approved testimon
            {testimonies.length === 1 ? "y" : "ies"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaPage() {
  return (
    <PinGate>
      <MediaContent />
    </PinGate>
  );
}
