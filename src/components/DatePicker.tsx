"use client";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  className = "",
}: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white ${className}`}
    />
  );
}

export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
