"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PinGate from "@/components/PinGate";
import ServiceSelector from "@/components/ServiceSelector";
import DatePicker, { getTodayDate } from "@/components/DatePicker";
import { subscribeToTestimonies, updateTestimonyStatus } from "@/lib/firebase";
import { Testimony } from "@/lib/types";

function PastorContent() {
  const [date, setDate] = useState(getTodayDate());
  const [service, setService] = useState("");
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!service) {
      setTestimonies([]);
      return;
    }

    // Subscribe to ALL testimonies (pending, approved, and declined)
    const unsubscribe = subscribeToTestimonies(
      date,
      service,
      null, // null means get all statuses
      setTestimonies // Show all testimonies without filtering
    );

    return () => unsubscribe();
  }, [date, service]);

  const handleApprove = async (id: string) => {
    setIsLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await updateTestimonyStatus(id, "approved");
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDecline = async (id: string) => {
    setIsLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await updateTestimonyStatus(id, "declined");
    } catch (error) {
      console.error("Failed to decline:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, [id]: false }));
    }
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Pastor View</h1>
        </header>

        <div className="px-4 py-6 md:px-6 md:py-8 max-w-2xl mx-auto">
        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-slate-600 text-sm mb-2">Date</label>
              <DatePicker value={date} onChange={setDate} className="w-full" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-slate-600 text-sm mb-2">
                Service
              </label>
              <ServiceSelector
                value={service}
                onChange={setService}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Count */}
        {service && (
          <div className="mb-4 flex gap-4 text-sm flex-wrap">
            <p className="text-yellow-600 font-medium">
              {testimonies.filter((t) => t.status === "pending").length} pending
            </p>
            <p className="text-green-600 font-medium">
              {testimonies.filter((t) => t.status === "approved").length} approved
            </p>
            <p className="text-red-600 font-medium">
              {testimonies.filter((t) => t.status === "declined").length} declined
            </p>
          </div>
        )}

        {/* Testimonies List */}
        {!service ? (
          <div className="text-center py-16">
            <p className="text-slate-600">
              Select a date and service to review testimonies
            </p>
          </div>
        ) : testimonies.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-slate-800 text-lg font-medium">
              All caught up!
            </p>
            <p className="text-slate-600 text-sm mt-1">
              No testimonies for this date and service
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonies.map((testimony) => {
              const isPending = testimony.status === "pending";
              const isApproved = testimony.status === "approved";
              const isDeclined = testimony.status === "declined";
              
              return (
              <div
                key={testimony.id}
                className={`bg-white rounded-xl p-5 shadow-lg border animate-fade-in ${
                  isApproved 
                    ? "border-green-200 bg-green-50/30" 
                    : isDeclined 
                    ? "border-red-200 bg-red-50/30"
                    : "border-slate-200"
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {testimony.name}
                    </h3>
                    {testimony.phone && (
                      <p className="text-sm text-slate-500">{testimony.phone}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      isPending
                        ? "bg-yellow-100 text-yellow-800"
                        : isApproved
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {testimony.status}
                  </span>
                </div>

                {testimony.whatDidYouDo && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      What they did:
                    </p>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                      {testimony.whatDidYouDo}
                    </p>
                  </div>
                )}

                <div className="mb-5">
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Testimony:
                  </p>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                    {testimony.description}
                  </p>
                </div>

                <div className="flex gap-3">
                  {(isPending || isDeclined) && (
                    <button
                      onClick={() => handleApprove(testimony.id)}
                      disabled={isLoading[testimony.id]}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors"
                    >
                      {isLoading[testimony.id] ? "..." : "✓ Approve"}
                    </button>
                  )}
                  {(isPending || isApproved) && (
                    <button
                      onClick={() => handleDecline(testimony.id)}
                      disabled={isLoading[testimony.id]}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors"
                    >
                      {isLoading[testimony.id] ? "..." : "✗ Decline"}
                    </button>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default function PastorPage() {
  return (
    <PinGate>
      <PastorContent />
    </PinGate>
  );
}
