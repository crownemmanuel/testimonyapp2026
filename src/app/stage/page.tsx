"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PinGate from "@/components/PinGate";
import ServiceSelector from "@/components/ServiceSelector";
import DatePicker, { getTodayDate } from "@/components/DatePicker";
import { subscribeToTestimonies } from "@/lib/firebase";
import { Testimony } from "@/lib/types";
import { formatDisplayName } from "@/lib/nameUtils";

function StageContent() {
  const [date, setDate] = useState(getTodayDate());
  const [service, setService] = useState("");
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Track IDs that were in the initial load
  const initialIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!service) {
      setTestimonies([]);
      setIsLoaded(false);
      isFirstLoadRef.current = true;
      initialIdsRef.current = new Set();
      return;
    }

    const unsubscribe = subscribeToTestimonies(
      date,
      service,
      "approved",
      (newTestimonies) => {
        if (isFirstLoadRef.current) {
          // First load - mark all as initial
          initialIdsRef.current = new Set(newTestimonies.map((t) => t.id));
          isFirstLoadRef.current = false;
        } else {
          // Check if there are any new testimonies that weren't in the initial load
          const hasNewTestimony = newTestimonies.some(
            (t) => !initialIdsRef.current.has(t.id)
          );
          
          // If new testimony detected, scroll to top smoothly
          if (hasNewTestimony) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
        setTestimonies(newTestimonies);
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [date, service]);

  const isNewTestimony = (id: string) => {
    return isLoaded && !initialIdsRef.current.has(id);
  };

  // Sort testimonies: new ones first, then by createdAt descending
  const sortedTestimonies = [...testimonies].sort((a, b) => {
    const aIsNew = isNewTestimony(a.id);
    const bIsNew = isNewTestimony(b.id);
    
    // New testimonies come first
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    
    // Within same group, sort by createdAt descending (newest first)
    return b.createdAt - a.createdAt;
  });

  const handleLoad = () => {
    // Reset and trigger reload
    isFirstLoadRef.current = true;
    initialIdsRef.current = new Set();
    setIsLoaded(false);
    // Force re-subscribe by toggling service
    const currentService = service;
    setService("");
    setTimeout(() => setService(currentService), 0);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        <header className="bg-slate-100 px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 transition-colors"
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Stage View</h1>
        </header>

        <div className="px-4 py-6 md:px-6 md:py-8">
        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-slate-700 text-sm mb-2 font-medium">Date</label>
              <DatePicker
                value={date}
                onChange={(newDate) => {
                  setDate(newDate);
                  isFirstLoadRef.current = true;
                  initialIdsRef.current = new Set();
                }}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-slate-700 text-sm mb-2 font-medium">
                Service
              </label>
              <ServiceSelector
                value={service}
                onChange={(newService) => {
                  setService(newService);
                  isFirstLoadRef.current = true;
                  initialIdsRef.current = new Set();
                }}
                className="w-full"
              />
            </div>
            <button
              onClick={handleLoad}
              disabled={!service}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Testimonies List */}
        {!service ? (
          <div className="text-center py-20">
            <p className="text-slate-600 text-lg">
              Select a date and service to view testimonies
            </p>
          </div>
        ) : testimonies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-600 text-lg">
              No approved testimonies for this date and service
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Listening for new testimonies...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTestimonies.map((testimony, index) => {
              const isNew = isNewTestimony(testimony.id);
              const isExpanded = expandedId === testimony.id;

              return (
                <div
                  key={testimony.id}
                  className={`rounded-xl p-5 transition-all duration-500 cursor-pointer shadow-lg ${
                    isNew
                      ? "bg-orange-500 border-2 border-orange-400 animate-pulse"
                      : "bg-white border border-slate-200 hover:shadow-xl"
                  }`}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : testimony.id)
                  }
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isNew && (
                        <span className="px-3 py-1 text-xs font-bold bg-white text-orange-600 rounded-full">
                          NEW
                        </span>
                      )}
                      <h3
                        className={`text-2xl font-bold ${
                          isNew ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {formatDisplayName(testimony.name) || testimony.name}
                      </h3>
                    </div>
                    <svg
                      className={`w-6 h-6 transition-transform ${
                        isNew ? "text-white" : "text-slate-600"
                      } ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {isExpanded && (
                    <div
                      className={`mt-4 pt-4 border-t ${
                        isNew ? "border-white/30" : "border-slate-200"
                      }`}
                    >
                      <p
                        className={`text-lg leading-relaxed ${
                          isNew ? "text-white/90" : "text-slate-700"
                        }`}
                      >
                        {testimony.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Count indicator */}
        {testimonies.length > 0 && (
          <div className="fixed bottom-6 right-6 bg-blue-600 rounded-full px-4 py-2 shadow-lg">
            <span className="text-white font-medium">
              {testimonies.length} testimon{testimonies.length === 1 ? "y" : "ies"}
            </span>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default function StagePage() {
  return (
    <PinGate>
      <StageContent />
    </PinGate>
  );
}
