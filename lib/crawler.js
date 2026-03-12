// lib/crawler.js

export async function searchMagnet(keyword, maxResults = 20) {
  console.log("🔍 搜索关键词:", keyword);

  try {
    const results = await Promise.any([
      searchFromBitSearch(keyword).then((r) => {
        if (r.length === 0) throw new Error("Bitsearch无结果");
        return r;
      }),
      searchFromSolidTorrents(keyword).then((r) => {
        if (r.length === 0) throw new Error("SolidTorrents无结果");
        return r;
      }),
    ]).catch(async () => {
      console.warn("两个源均无结果，尝试合并兜底...");
      const [r1, r2, r3] = await Promise.allSettled([
        searchFromBitSearch(keyword),
        searchFromSolidTorrents(keyword),
        searchFromNyaa(keyword),
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

// ✅ 搜索源1：Bitsearch.to（DNS 2026-03-11 确认在线，综合索引）
async function searchFromBitSearch(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://bitsearch.to/search?q=${encodeURIComponent(keyword)}&page=1`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      },
      10000,
    );

    if (!response.ok) throw new Error(`Bitsearch 失败: ${response.status}`);

    const html = await response.text();
    const results = [];

    // 解析磁力链接和标题
    const itemRegex = /<li class="search-result">([\s\S]*?)<\/li>/g;
    let match;
    while ((match = itemRegex.exec(html)) !== null && results.length < 15) {
      const block = match[1];
      const title =
        block.match(/class="title"[^>]*>([^<]+)</)?.[1]?.trim() || "未知标题";
      const magnet = block.match(/href="(magnet:\?[^"]+)"/)?.[1] || "";
      const size =
        block.match(/class="size"[^>]*>([^<]+)</)?.[1]?.trim() || "未知";
      const seeders = parseInt(
        block.match(/class="seeds"[^>]*>(\d+)</)?.[1] || "0",
      );
      const hash = magnet.match(/btih:([a-fA-F0-9]{40})/i)?.[1] || "";

      if (hash) {
        results.push({
          title,
          magnet:
            magnet ||
            `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337`,
          size,
          date: "未知",
          seeders,
          source: "Bitsearch",
        });
      }
    }
    return results;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Bitsearch 请求超时");
    } else {
      console.error("Bitsearch 搜索失败:", error.message);
    }
    return [];
  }
}

// ✅ 搜索源2：SolidTorrents.to（2026-03-11 确认在线，DHT综合索引）
async function searchFromSolidTorrents(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://solidtorrents.to/api/v1/search?q=${encodeURIComponent(keyword)}&sort=seeders&fuv=0`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      },
      10000,
    );

    if (!response.ok) throw new Error(`SolidTorrents 失败: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data?.results)) return [];

    return data.results
      .map((item) => ({
        title: item.title || "未知标题",
        magnet: `magnet:?xt=urn:btih:${item.infohash}&dn=${encodeURIComponent(item.title || "")}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337`,
        size: item.size ? formatSize(item.size) : "未知",
        date: item.importedOn
          ? new Date(item.importedOn).toISOString().split("T")[0]
          : "未知",
        seeders: item.swarm?.seeders || 0,
        source: "SolidTorrents",
      }))
      .filter((i) => i.magnet);
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("SolidTorrents 请求超时");
    } else {
      console.error("SolidTorrents 搜索失败:", error.message);
    }
    return [];
  }
}

// ✅ 兜底源：Nyaa RSS（动漫/日系，长期稳定）
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
    while ((match = itemRegex.exec(text)) !== null && results.length < 10) {
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

      if (title && infoHash) {
        results.push({
          title,
          magnet: `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337`,
          size,
          date: "未知",
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

function formatDate(timestamp) {
  if (!timestamp) return "未知";
  if (typeof timestamp === "string" && timestamp.includes("-")) {
    return timestamp.split("T")[0];
  }
  const date = new Date(Number(timestamp) * 1000);
  if (isNaN(date.getTime())) return String(timestamp);
  return date.toISOString().split("T")[0];
}
