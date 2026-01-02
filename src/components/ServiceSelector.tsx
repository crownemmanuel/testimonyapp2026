"use client";

import { useState, useEffect } from "react";
import { getServices, ServiceType } from "@/lib/firebase";

interface ServiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ServiceSelector({
  value,
  onChange,
  className = "",
}: ServiceSelectorProps) {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const loadedServices = await getServices();
        setServices(loadedServices);
      } catch (error) {
        console.error("Failed to load services:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, []);

  if (isLoading) {
    return (
      <select
        disabled
        className={`px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 ${className}`}
      >
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white ${className}`}
    >
      <option value="">Select Service</option>
      {services.map((service) => (
        <option key={service.id} value={service.key}>
          {service.name}
        </option>
      ))}
    </select>
  );
}
