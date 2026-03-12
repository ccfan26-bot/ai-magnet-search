// lib/crawler.js

export async function searchMagnet(keyword, maxResults = 20) {
  console.log("🔍 搜索关键词:", keyword);

  try {
    const results = await Promise.any([
      searchFromKnaben(keyword).then((r) => {
        if (r.length === 0) throw new Error("Knaben无结果");
        return r;
      }),
      searchFromYTS(keyword).then((r) => {
        if (r.length === 0) throw new Error("YTS无结果");
        return r;
      }),
    ]).catch(async () => {
      console.warn("两个源均无结果，尝试合并兜底...");
      const [r1, r2] = await Promise.allSettled([
        searchFromKnaben(keyword),
        searchFromYTS(keyword),
      ]);
      return [
        ...(r1.status === "fulfilled" ? r1.value : []),
        ...(r2.status === "fulfilled" ? r2.value : []),
      ];
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error("❌ 搜索失败:", error.message);
    return [];
  }
}

// ✅ 封装带超时的 fetch
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

// 搜索源 1: Knaben（聚合搜索，有公开API）
async function searchFromKnaben(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://knaben.eu/api/v1/search/${encodeURIComponent(keyword)}/0/25/seeders/false`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      },
      10000,
    );

    if (!response.ok) throw new Error(`Knaben API 失败: ${response.status}`);

    const data = await response.json();

    return (
      data.hits?.map((item) => ({
        title: item.title || "未知标题",
        magnet:
          item.magnetLink ||
          `magnet:?xt=urn:btih:${item.hash}&dn=${encodeURIComponent(item.title || "")}`,
        size: formatSize(item.bytes),
        date: item.added
          ? new Date(item.added * 1000).toISOString().split("T")[0]
          : "未知",
        seeders: item.seeders || 0,
        source: "Knaben",
      })) || []
    );
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Knaben 请求超时");
    } else {
      console.error("Knaben 搜索失败:", error.message);
    }
    return [];
  }
}

// 搜索源 2: YTS（电影资源，官方API最稳定）
async function searchFromYTS(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(keyword)}&limit=20&sort_by=seeds`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      },
      10000,
    );

    if (!response.ok) throw new Error(`YTS API 失败: ${response.status}`);

    const data = await response.json();
    const movies = data?.data?.movies;
    if (!movies?.length) return [];

    const results = [];
    for (const movie of movies) {
      for (const torrent of (movie.torrents || []).slice(0, 2)) {
        results.push({
          title: `${movie.title} (${movie.year}) [${torrent.quality}]`,
          magnet: `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337`,
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

// 格式化文件大小
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

// 格式化日期
function formatDate(timestamp) {
  if (!timestamp) return "未知";
  if (typeof timestamp === "string" && timestamp.includes("-")) {
    return timestamp.split("T")[0];
  }
  const date = new Date(Number(timestamp) * 1000);
  if (isNaN(date.getTime())) return String(timestamp);
  return date.toISOString().split("T")[0];
}
