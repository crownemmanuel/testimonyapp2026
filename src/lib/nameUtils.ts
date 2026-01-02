// Prefixes to remove from names
const PREFIXES_TO_REMOVE = [
  "sister",
  "sis.",
  "sis",
  "brother",
  "bro.",
  "bro",
  "pastor",
  "pst.",
  "pst",
  "doctor",
  "dr.",
  "dr",
  "reverend",
  "rev.",
  "rev",
  "minister",
  "min.",
  "min",
  "elder",
  "eld.",
  "eld",
  "deacon",
  "dcn.",
  "dcn",
  "deaconess",
  "dcns.",
  "dcns",
  "apostle",
  "prophet",
  "evangelist",
  "bishop",
  "mrs.",
  "mrs",
  "mr.",
  "mr",
  "ms.",
  "ms",
  "miss",
];

/**
 * Clean a name by removing common titles/prefixes
 */
export function cleanName(name: string): string {
  if (!name) return "";

  let cleanedName = name.trim();

  // Check each prefix and remove if found at the start
  for (const prefix of PREFIXES_TO_REMOVE) {
    const regex = new RegExp(`^${prefix}\\s+`, "i");
    if (regex.test(cleanedName)) {
      cleanedName = cleanedName.replace(regex, "");
      break; // Only remove one prefix
    }
  }

  return cleanedName.trim();
}

/**
 * Format name for display: "FirstName L."
 * Returns first name and last initial with period
 */
export function formatDisplayName(name: string): string {
  if (!name) return "";

  const cleanedName = cleanName(name);
  const parts = cleanedName.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const lastInitial = lastName.charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
}

/**
 * Format name for copy button: "FirstName L."
 * Same as formatDisplayName but ensures proper capitalization
 */
export function formatNameForCopy(name: string): string {
  const displayName = formatDisplayName(name);
  if (!displayName) return "";

  // Capitalize first letter of first name
  const parts = displayName.split(" ");
  if (parts.length > 0) {
    parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }

  return parts.join(" ");
}

/**
 * Get full cleaned name (first and last name without titles)
 */
export function getFullCleanName(name: string): string {
  return cleanName(name);
}

/**
 * Get first name only
 */
export function getFirstName(name: string): string {
  const cleanedName = cleanName(name);
  const parts = cleanedName.split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[0] : "";
}

/**
 * Get last name only
 */
export function getLastName(name: string): string {
  const cleanedName = cleanName(name);
  const parts = cleanedName.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}
