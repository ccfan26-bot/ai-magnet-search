// lib/crawler.js

// ✅ Knaben - 聚合搜索引擎，有公开API
async function searchKnaben(keywords) {
  const query = encodeURIComponent(keywords.join(" "));
  const url = `https://knaben.eu/api/v1/search/${query}/0/25/seeders/false`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Knaben 失败: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.hits)) return [];

  return data.hits
    .slice(0, 15)
    .map((item) => ({
      title: item.title || "未知",
      magnet: item.magnetLink || `magnet:?xt=urn:btih:${item.hash}`,
      size: item.bytes ? formatSize(item.bytes) : "未知",
      date: item.added
        ? new Date(item.added * 1000).toLocaleDateString("zh-CN")
        : "未知",
      seeders: item.seeders || 0,
      source: "Knaben",
    }))
    .filter((i) => i.magnet);
}

// ✅ EZTV 官方API - TV剧资源
async function searchEZTV(keywords) {
  const query = encodeURIComponent(keywords.join(" "));
  const url = `https://eztv.re/api/get-torrents?limit=15&page=1&Keywords=${query}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`EZTV 失败: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.torrents)) return [];

  return data.torrents
    .slice(0, 10)
    .map((item) => ({
      title: item.title || "未知",
      magnet: item.magnet_url || "",
      size: item.size_bytes ? formatSize(parseInt(item.size_bytes)) : "未知",
      date: item.date_released_unix
        ? new Date(item.date_released_unix * 1000).toLocaleDateString("zh-CN")
        : "未知",
      seeders: item.seeds || 0,
      source: "EZTV",
    }))
    .filter((i) => i.magnet);
}

// ✅ YTS - 电影资源（官方API，最稳定）
async function searchYTS(keywords) {
  const query = encodeURIComponent(keywords.join(" "));
  const url = `https://yts.mx/api/v2/list_movies.json?query_term=${query}&limit=10&sort_by=seeds`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`YTS 失败: ${res.status}`);
  const data = await res.json();
  const movies = data?.data?.movies;
  if (!movies?.length) return [];

  const results = [];
  for (const movie of movies) {
    for (const torrent of (movie.torrents || []).slice(0, 2)) {
      results.push({
        title: `${movie.title} (${movie.year}) [${torrent.quality}]`,
        magnet: `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title)}&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337`,
        size: torrent.size || "未知",
        date: torrent.date_uploaded || "未知",
        seeders: torrent.seeds || 0,
        source: "YTS",
      });
    }
  }
  return results;
}

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return "未知";
  if (bytes > 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + " GB";
  if (bytes > 1024 ** 2) return (bytes / 1024 ** 2).toFixed(2) + " MB";
  return (bytes / 1024).toFixed(2) + " KB";
}

export async function searchMagnets(keywords) {
  console.log("🔍 搜索关键词：", keywords.join(" "));

  const results = await Promise.allSettled([
    searchKnaben(keywords),
    searchYTS(keywords),
    searchEZTV(keywords),
  ]);

  const r1 = results[0].status === "fulfilled" ? results[0].value : [];
  const r2 = results[1].status === "fulfilled" ? results[1].value : [];
  const r3 = results[2].status === "fulfilled" ? results[2].value : [];

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const names = ["Knaben", "YTS", "EZTV"];
      console.error(`❌ ${names[i]} 失败:`, r.reason?.message);
    }
  });

  const combined = [...r1, ...r2, ...r3];
  combined.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));

  console.log(
    `✅ 共找到 ${combined.length} 个结果（Knaben:${r1.length} YTS:${r2.length} EZTV:${r3.length}）`,
  );
  return combined;
}
