"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { submitTestimony, lookupPhone, getServices } from "@/lib/firebase";
import { ServiceType } from "@/lib/types";
import { getTodayDate } from "@/components/DatePicker";

export default function SubmitTestimony() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [formData, setFormData] = useState({
    service: "",
    phone: "",
    name: "",
    email: "",
    whatDidYouDo: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadServices() {
      try {
        const loadedServices = await getServices();
        setServices(loadedServices);
      } catch (error) {
        console.error("Failed to load services:", error);
      }
    }
    loadServices();
  }, []);

  // Phone lookup with debounce
  const handlePhoneLookup = useCallback(async (phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length >= 10) {
      setIsLookingUp(true);
      try {
        const result = await lookupPhone(normalizedPhone);
        if (result) {
          setFormData((prev) => ({
            ...prev,
            name: result.name || prev.name,
            email: result.email || prev.email,
          }));
        }
      } catch (error) {
        console.error("Phone lookup failed:", error);
      } finally {
        setIsLookingUp(false);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.phone) {
        handlePhoneLookup(formData.phone);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.phone, handlePhoneLookup]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.service) {
      newErrors.service = "Please select a service";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Please describe your testimony";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      await submitTestimony({
        date: getTodayDate(),
        service: formData.service,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        whatDidYouDo: formData.whatDidYouDo.trim() || undefined,
        description: formData.description.trim(),
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to submit testimony:", error);
      setErrors({ submit: "Failed to submit. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="text-6xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Thank You!
          </h1>
          <p className="text-slate-600 mb-6">
            Your testimony has been submitted successfully. It will be reviewed
            shortly.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  service: "",
                  phone: "",
                  name: "",
                  email: "",
                  whatDidYouDo: "",
                  description: "",
                });
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Submit Another Testimony
            </button>
            <Link
              href="/"
              className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Testimony Form
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="w-full px-4 py-6 md:px-6 md:py-8 space-y-5 max-w-2xl mx-auto">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Service <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.service === service.key
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={service.key}
                    checked={formData.service === service.key}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      formData.service === service.key
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-400"
                    }`}
                  >
                    {formData.service === service.key && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-medium text-slate-700">
                    {service.name}
                  </span>
                </label>
              ))}
            </div>
            {errors.service && (
              <p className="text-red-500 text-sm mt-1">{errors.service}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
              {isLookingUp && (
                <span className="ml-2 text-blue-600 text-xs">
                  Looking up...
                </span>
              )}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Optional - helps us find your info faster
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${
                errors.name ? "border-red-400" : "border-slate-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {/* What did you do */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What did you do?
            </label>
            <textarea
              name="whatDidYouDo"
              value={formData.whatDidYouDo}
              onChange={handleChange}
              placeholder="Briefly describe what action you took..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Testimony Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe Your Testimony <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Share your testimony in detail..."
              rows={5}
              className={`w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none ${
                errors.description ? "border-red-400" : "border-slate-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-colors text-lg shadow-lg"
          >
            {isLoading ? "Submitting..." : "Submit Testimony"}
          </button>
        </form>
      </div>
    </div>
  );
}
