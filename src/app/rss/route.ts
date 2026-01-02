import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch live testimony from Firebase Realtime Database REST API
    const databaseUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
    const response = await fetch(`${databaseUrl}/liveTestimony.json`, {
      cache: "no-store",
    });

    let title = "";
    let description = "";

    if (response.ok) {
      const liveData = await response.json();
      if (liveData) {
        title = liveData.displayName || "";
        description = liveData.name || "";
      }
    }

    // Generate RSS XML with the name in the title for ProPresenter
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Church Testimony</title>
    <link>${process.env.NEXT_PUBLIC_SITE_URL || ""}</link>
    <description>Live testimony display for ProPresenter</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>1</ttl>
    <item>
      <title>${escapeXml(title)}</title>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("RSS feed error:", error);

    // Return empty RSS on error
    const emptyRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Church Testimony</title>
    <description>Live testimony display</description>
    <item>
      <title></title>
      <description></description>
    </item>
  </channel>
</rss>`;

    return new NextResponse(emptyRss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}

function escapeXml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
