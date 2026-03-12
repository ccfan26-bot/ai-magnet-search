// lib/crawler.js

export async function searchMagnet(keyword, maxResults = 20) {
  console.log("🔍 搜索关键词:", keyword);

  try {
    const results = await Promise.any([
      searchFromYTS(keyword).then((r) => {
        if (r.length === 0) throw new Error("YTS无结果");
        return r;
      }),
      searchFromNyaa(keyword).then((r) => {
        if (r.length === 0) throw new Error("Nyaa无结果");
        return r;
      }),
    ]).catch(async () => {
      console.warn("两个源均无结果，尝试合并兜底...");
      const [r1, r2, r3] = await Promise.allSettled([
        searchFromYTS(keyword),
        searchFromNyaa(keyword),
        searchFromBtdig(keyword),
      ]);
      return [
        ...(r1.status === "fulfilled" ? r1.value : []),
        ...(r2.status === "fulfilled" ? r2.value : []),
        ...(r3.status === "fulfilled" ? r3.value : []),
      ];
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error("❌ 搜索失败:", error.message);
    return [];
  }
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ✅ 源1：YTS（新 API 地址 movies-api.accel.li，2026-03-12 已验证返回数据）
async function searchFromYTS(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://movies-api.accel.li/api/v2/list_movies.json?query_term=${encodeURIComponent(keyword)}&sort_by=seeds&limit=20`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      },
      10000,
    );

    if (!response.ok) throw new Error(`YTS 失败: ${response.status}`);
    const data = await response.json();

    const movies = data?.data?.movies;
    if (!Array.isArray(movies)) return [];

    // 官方推荐的 tracker 列表
    const TRACKERS = [
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://tracker.torrent.eu.org:451/announce",
      "udp://tracker.dler.org:6969/announce",
      "udp://open.stealth.si:80/announce",
      "udp://open.demonii.com:1337/announce",
      "https://tracker.moeblog.cn:443/announce",
      "udp://open.dstud.io:6969/announce",
      "udp://tracker.srv00.com:6969/announce",
      "https://tracker.zhuqiy.com:443/announce",
      "https://tracker.pmman.tech:443/announce",
    ]
      .map((t) => `&tr=${encodeURIComponent(t)}`)
      .join("");

    const results = [];
    for (const movie of movies) {
      if (!Array.isArray(movie.torrents)) continue;
      for (const torrent of movie.torrents) {
        if (!torrent.hash) continue;
        const title = `${movie.title_long} [${torrent.quality}]`;
        results.push({
          title,
          magnet: `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(title)}${TRACKERS}`,
          size: torrent.size || "未知",
          date: torrent.date_uploaded?.split(" ")[0] || "未知",
          seeders: torrent.seeds || 0,
          source: "YTS",
        });
      }
    }
    return results;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("YTS 请求超时");
    } else {
      console.error("YTS 搜索失败:", error.message);
    }
    return [];
  }
}

// ✅ 源2：Nyaa.si RSS（2026-01 月访问 4089万，RSS 无 CF 保护）
async function searchFromNyaa(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://nyaa.si/?page=rss&q=${encodeURIComponent(keyword)}&c=0_0&f=0`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/rss+xml, text/xml",
        },
      },
      10000,
    );

    if (!response.ok) throw new Error(`Nyaa 失败: ${response.status}`);
    const text = await response.text();

    const results = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null && results.length < 15) {
      const block = match[1];
      const title =
        block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        block.match(/<title>(.*?)<\/title>/)?.[1] ||
        "";
      const infoHash =
        block.match(/<nyaa:infoHash>([a-fA-F0-9]+)<\/nyaa:infoHash>/)?.[1] ||
        "";
      const size = block.match(/<nyaa:size>(.*?)<\/nyaa:size>/)?.[1] || "未知";
      const seeders = parseInt(
        block.match(/<nyaa:seeders>(\d+)<\/nyaa:seeders>/)?.[1] || "0",
      );
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

      if (title && infoHash) {
        results.push({
          title,
          magnet: `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337`,
          size,
          date: pubDate
            ? new Date(pubDate).toISOString().split("T")[0]
            : "未知",
          seeders,
          source: "Nyaa",
        });
      }
    }
    return results;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Nyaa 请求超时");
    } else {
      console.error("Nyaa 搜索失败:", error.message);
    }
    return [];
  }
}

// ✅ 兜底源：btdig.com（DHT实时索引，全球 #7834，无 CF）
async function searchFromBtdig(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://btdig.com/search?q=${encodeURIComponent(keyword)}&p=0&order=0`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html",
        },
      },
      12000,
    );

    if (!response.ok) throw new Error(`BTDig 失败: ${response.status}`);
    const html = await response.text();

    const results = [];
    // 解析搜索结果条目
    const itemRegex =
      /<div class="one_result">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    let match;
    while ((match = itemRegex.exec(html)) !== null && results.length < 10) {
      const block = match[1];
      const title =
        block
          .match(
            /class="torrent_name"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/,
          )?.[1]
          ?.replace(/<[^>]+>/g, "")
          .trim() || "";
      const hash = block.match(/\/([a-fA-F0-9]{40})\b/)?.[1] || "";
      const size =
        block
          .match(/class="torrent_size"[^>]*>([\s\S]*?)<\/div>/)?.[1]
          ?.replace(/<[^>]+>/g, "")
          .trim() || "未知";
      const date =
        block
          .match(/class="torrent_age"[^>]*>([\s\S]*?)<\/div>/)?.[1]
          ?.replace(/<[^>]+>/g, "")
          .trim() || "未知";

      if (title && hash) {
        results.push({
          title,
          magnet: `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337`,
          size,
          date,
          seeders: 0,
          source: "BTDig",
        });
      }
    }
    return results;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("BTDig 请求超时");
    } else {
      console.error("BTDig 搜索失败:", error.message);
    }
    return [];
  }
}

function formatSize(bytes) {
  if (!bytes) return "未知";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = parseInt(bytes);
  if (isNaN(size)) return String(bytes);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
