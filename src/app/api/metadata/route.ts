import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { jsonError, jsonSuccess } from "@/lib/utils/response";
import { Logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return jsonError("BAD_REQUEST", "Query parameter 'url' is required.", 400);
  }

  try {
    let urlObj: URL;
    try {
      urlObj = new URL(targetUrl.trim());
    } catch {
      return jsonError("BAD_REQUEST", "Invalid URL provided.", 400);
    }

    const hostname = urlObj.hostname.toLowerCase();
    const isWikimedia =
      hostname.includes("wikimedia.org") ||
      hostname.includes("wikipedia.org") ||
      hostname.includes("commons.wikimedia.org");
    const isFlickr = hostname.includes("flickr.com") || hostname.includes("flic.kr");

    if (!isWikimedia && !isFlickr) {
      return jsonError(
        "BAD_REQUEST",
        "Auto-retrieval is only supported for Wikimedia Commons and Flickr URLs.",
        400
      );
    }

    let imageUrl = targetUrl;
    let author = "Unknown Author";
    let license = "Unknown License";
    let licenseUrl = "";
    let title = "";
    let source = isWikimedia ? "Wikimedia Commons" : "Flickr";

    if (isWikimedia) {
      // Wikimedia Commons API extraction
      const fileMatch = targetUrl.match(/File:(.+)$/i);
      if (fileMatch) {
        const rawFilename = decodeURIComponent(fileMatch[1].split("#")[0].split("?")[0]);
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|url&titles=File:${encodeURIComponent(
          rawFilename
        )}&format=json`;

        const res = await fetch(apiUrl, {
          headers: { "User-Agent": "DoldFindAdminPortal/1.0 (admin@doldfind.org)" },
        });

        if (res.ok) {
          const data = await res.json();
          const pages = data.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const page = pages[pageId];
            if (page && page.imageinfo && page.imageinfo.length > 0) {
              const info = page.imageinfo[0];
              if (info.url) imageUrl = info.url;

              if (info.extmetadata) {
                const meta = info.extmetadata;
                if (meta.Artist?.value) {
                  author = meta.Artist.value.replace(/<[^>]*>?/gm, "").trim();
                }
                if (meta.LicenseShortName?.value) {
                  license = meta.LicenseShortName.value.trim();
                } else if (meta.License?.value) {
                  license = meta.License.value.toUpperCase().trim();
                }
                if (meta.LicenseUrl?.value) {
                  licenseUrl = meta.LicenseUrl.value.trim();
                }
                if (meta.ObjectName?.value) {
                  title = meta.ObjectName.value.trim();
                }
              }
            }
          }
        }
      } else {
        // Direct media upload URL on wikimedia
        author = "Wikimedia Commons Contributor";
        license = "CC BY-SA 4.0";
      }
    } else if (isFlickr) {
      // Flickr oEmbed & HTML meta extraction
      const oembedUrl = `https://www.flickr.com/services/oembed/?format=json&url=${encodeURIComponent(
        targetUrl
      )}`;
      try {
        const oembedRes = await fetch(oembedUrl);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.author_name) author = oembedData.author_name.trim();
          if (oembedData.title) title = oembedData.title.trim();
          if (oembedData.url) imageUrl = oembedData.url;
          else if (oembedData.thumbnail_url) {
            imageUrl = oembedData.thumbnail_url.replace("_q.jpg", "_b.jpg");
          }
        }
      } catch (err) {
        Logger.warn(`Flickr oEmbed fetch failed: ${err}`);
      }

      try {
        const htmlRes = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const $ = cheerio.load(html);

          const ogImage = $('meta[property="og:image"]').attr("content");
          if (ogImage) imageUrl = ogImage;

          const ccLink = $('a[rel="license"]').attr("href");
          if (ccLink) {
            licenseUrl = ccLink;
            if (ccLink.includes("licenses/by-sa/")) license = "CC BY-SA";
            else if (ccLink.includes("licenses/by/")) license = "CC BY";
            else if (ccLink.includes("licenses/by-nc/")) license = "CC BY-NC";
            else if (ccLink.includes("licenses/by-nd/")) license = "CC BY-ND";
            else if (ccLink.includes("publicdomain/")) license = "Public Domain";
          }
        }
      } catch (err) {
        Logger.warn(`Flickr HTML cheerio scraping failed: ${err}`);
      }
    }

    // Construct formatted credit string
    const creditString = `${author} (${license})`;

    return jsonSuccess("Metadata retrieved successfully.", undefined, 200, {
      imageUrl,
      author,
      license,
      licenseUrl,
      sourceUrl: targetUrl,
      title,
      source,
      creditString,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    Logger.error("Metadata auto-retrieval failed:", msg);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve metadata from URL.", 500);
  }
}
