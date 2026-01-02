"use client";

import { Testimony } from "@/lib/types";
import { formatDisplayName } from "@/lib/nameUtils";

interface TestimonyCardProps {
  testimony: Testimony;
  variant?: "compact" | "full" | "pastor";
  isNew?: boolean;
  onApprove?: () => void;
  onDecline?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyName?: () => void;
  onSetLive?: () => void;
  showStatus?: boolean;
}

export default function TestimonyCard({
  testimony,
  variant = "compact",
  isNew = false,
  onApprove,
  onDecline,
  onEdit,
  onDelete,
  onCopyName,
  onSetLive,
  showStatus = false,
}: TestimonyCardProps) {
  const displayName = formatDisplayName(testimony.name);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    declined: "bg-red-100 text-red-800 border-red-300",
  };

  const cardClasses = `
    rounded-xl border p-4 transition-all duration-300
    ${isNew ? "bg-orange-50 border-orange-400 shadow-lg shadow-orange-200" : "bg-white border-gray-200"}
  `;

  if (variant === "compact") {
    return (
      <div className={cardClasses}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isNew && (
              <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full animate-pulse">
                NEW
              </span>
            )}
            <h3 className="text-lg font-semibold text-slate-800">
              {displayName || testimony.name}
            </h3>
          </div>
          {showStatus && (
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[testimony.status]}`}
            >
              {testimony.status}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === "pastor") {
    return (
      <div className={cardClasses}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {testimony.name}
            </h3>
            {testimony.phone && (
              <p className="text-sm text-slate-500">{testimony.phone}</p>
            )}
          </div>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[testimony.status]}`}
          >
            {testimony.status}
          </span>
        </div>

        {testimony.whatDidYouDo && (
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-600">What they did:</p>
            <p className="text-slate-700">{testimony.whatDidYouDo}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-slate-600">Testimony:</p>
          <p className="text-slate-700 whitespace-pre-wrap">
            {testimony.description}
          </p>
        </div>

        {(onApprove || onDecline) && testimony.status === "pending" && (
          <div className="flex gap-3">
            {onApprove && (
              <button
                onClick={onApprove}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
              >
                Approve
              </button>
            )}
            {onDecline && (
              <button
                onClick={onDecline}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
              >
                Decline
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full variant (for admin)
  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{testimony.name}</h3>
          <div className="flex gap-4 text-sm text-slate-500">
            {testimony.phone && <span>{testimony.phone}</span>}
            {testimony.email && <span>{testimony.email}</span>}
          </div>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[testimony.status]}`}
        >
          {testimony.status}
        </span>
      </div>

      <div className="text-sm text-slate-600 mb-2">
        <span className="font-medium">Service:</span> {testimony.service} |{" "}
        <span className="font-medium">Date:</span> {testimony.date}
      </div>

      {testimony.whatDidYouDo && (
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-600">What they did:</p>
          <p className="text-slate-700">{testimony.whatDidYouDo}</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm font-medium text-slate-600">Testimony:</p>
        <p className="text-slate-700 whitespace-pre-wrap">
          {testimony.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {onApprove && testimony.status !== "approved" && (
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Approve
          </button>
        )}
        {onDecline && testimony.status !== "declined" && (
          <button
            onClick={onDecline}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Decline
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Delete
          </button>
        )}
        {onCopyName && (
          <button
            onClick={onCopyName}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Copy Name
          </button>
        )}
        {onSetLive && (
          <button
            onClick={onSetLive}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Live
          </button>
        )}
      </div>
    </div>
  );
}
