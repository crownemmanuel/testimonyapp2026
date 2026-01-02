"use client";

import { useState, useEffect, ReactNode } from "react";

interface PinGateProps {
  children: ReactNode;
}

const PIN_STORAGE_KEY = "testimony_pin_validated";

export default function PinGate({ children }: PinGateProps) {
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already validated in localStorage
    const validated = localStorage.getItem(PIN_STORAGE_KEY);
    if (validated === "true") {
      setIsValidated(true);
    } else {
      setIsValidated(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (data.valid) {
        localStorage.setItem(PIN_STORAGE_KEY, "true");
        setIsValidated(true);
      } else {
        setError("Invalid PIN. Please try again.");
        setPin("");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Still checking localStorage
  if (isValidated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-600 text-xl">Loading...</div>
      </div>
    );
  }

  // Not validated, show PIN form
  if (!isValidated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 w-full max-w-sm shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">
            Enter PIN
          </h2>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter PIN"
              className="w-full px-4 py-4 text-2xl text-center bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 tracking-[0.5em]"
              maxLength={6}
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-sm text-center mt-3">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 text-lg shadow-md"
            >
              {isLoading ? "Verifying..." : "Enter"}
            </button>
          </form>
          <a
            href="/"
            className="block text-center text-slate-600 hover:text-slate-800 mt-4 text-sm"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Validated, show children
  return <>{children}</>;
}
