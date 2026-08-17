import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
  }

  try {
    const isWikimedia = url.includes("wikimedia.org") || url.includes("wikipedia.org");
    const isFlickr = url.includes("flickr.com");

    if (!isWikimedia && !isFlickr) {
      return NextResponse.json(
        { success: false, error: "Only Wikimedia and Flickr URLs are supported. All other URLs are rejected." },
        { status: 400 }
      );
    }

    let imageUrl = url;
    let author = "Unknown Author";
    let license = "Unknown License";
    let licenseUrl = "";
    let sourceUrl = url;
    let title = "";

    if (isWikimedia) {
      // Example URL: https://commons.wikimedia.org/wiki/File:Example.jpg
      const fileMatch = url.match(/File:(.+)$/);
      if (fileMatch) {
        const filename = decodeURIComponent(fileMatch[1]);
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|url&titles=File:${encodeURIComponent(filename)}&format=json`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();
        const pages = data.query?.pages;
        
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const page = pages[pageId];
          if (page && page.imageinfo && page.imageinfo.length > 0) {
            const info = page.imageinfo[0];
            imageUrl = info.url || imageUrl;
            
            if (info.extmetadata) {
              const meta = info.extmetadata;
              if (meta.Artist) author = meta.Artist.value.replace(/<[^>]*>?/gm, '').trim(); // Remove HTML tags
              if (meta.LicenseShortName) license = meta.LicenseShortName.value;
              if (meta.LicenseUrl) licenseUrl = meta.LicenseUrl.value;
              if (meta.ObjectName) title = meta.ObjectName.value;
            }
          }
        }
      } else {
        // Fallback for Wikimedia if not a File: page (e.g. direct image link)
        imageUrl = url;
        author = "Wikimedia Contributor";
        license = "CC BY-SA";
      }
    } else if (isFlickr) {
      // Use Flickr oEmbed API as a fallback to get basic info
      const oembedUrl = `https://www.flickr.com/services/oembed/?format=json&url=${encodeURIComponent(url)}`;
      try {
        const oembedRes = await fetch(oembedUrl);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          author = oembedData.author_name || author;
          title = oembedData.title || title;
          // oEmbed doesn't reliably return the raw image url, but we'll try to find it
          if (oembedData.url) imageUrl = oembedData.url;
          else if (oembedData.thumbnail_url) imageUrl = oembedData.thumbnail_url.replace('_q.jpg', '_b.jpg'); // Try to get larger size
        }
      } catch (err) {
        // Ignore oembed errors
      }

      // Try scraping for more metadata if oEmbed lacks it
      try {
        const htmlRes = await fetch(url);
        const html = await htmlRes.text();
        const $ = cheerio.load(html);
        
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) imageUrl = ogImage;
        
        // Flickr often puts license info in standard CC rel attributes or text
        const ccLink = $('a[rel="license"]').attr('href');
        if (ccLink) {
          licenseUrl = ccLink;
          if (ccLink.includes('licenses/by/')) {
            license = 'CC BY';
          } else if (ccLink.includes('licenses/by-sa/')) {
            license = 'CC BY-SA';
          } else if (ccLink.includes('licenses/by-nd/')) {
            license = 'CC BY-ND';
          } else if (ccLink.includes('licenses/by-nc/')) {
            license = 'CC BY-NC';
          } else if (ccLink.includes('publicdomain/')) {
            license = 'Public Domain';
          }
        }
      } catch (err) {
        // Ignore scraper errors
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        author,
        license,
        licenseUrl,
        sourceUrl,
        title
      }
    });
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch metadata" }, { status: 500 });
  }
}
