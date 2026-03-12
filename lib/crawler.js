// lib/crawler.js

export async function searchMagnet(keyword, maxResults = 20) {
  console.log("🔍 搜索关键词:", keyword);

  try {
    // 使用多个磁力搜索源
    const sources = [searchFromBTSow(keyword), searchFromZhaoMagnet(keyword)];

    const results = await Promise.race(sources);
    return results.slice(0, maxResults);
  } catch (error) {
    console.error("❌ 搜索失败:", error.message);
    return [];
  }
}

// 搜索源 1: BT搜
async function searchFromBTSow(keyword) {
  try {
    const response = await fetch(
      `https://btsow.rest/api/search?keyword=${encodeURIComponent(keyword)}&limit=20`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      },
    );

    if (!response.ok) throw new Error("BT搜 API 失败");

    const data = await response.json();

    return (
      data.results?.map((item) => ({
        title: item.name || item.title,
        magnet: item.magnet || `magnet:?xt=urn:btih:${item.hash}`,
        size: formatSize(item.size || item.length),
        date: formatDate(item.create_time || item.date),
        source: "BT搜",
      })) || []
    );
  } catch (error) {
    console.error("BT搜搜索失败:", error);
    return [];
  }
}

// 搜索源 2: 找磁力
async function searchFromZhaoMagnet(keyword) {
  try {
    const response = await fetch(
      `https://zhaomagnet.com/api/search?q=${encodeURIComponent(keyword)}&page=1`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        timeout: 10000,
      },
    );

    if (!response.ok) throw new Error("找磁力 API 失败");

    const data = await response.json();

    return (
      data.list?.map((item) => ({
        title: item.name,
        magnet: item.magnet,
        size: item.size,
        date: item.date,
        source: "找磁力",
      })) || []
    );
  } catch (error) {
    console.error("找磁力搜索失败:", error);
    return [];
  }
}

// 格式化文件大小
function formatSize(bytes) {
  if (!bytes) return "未知";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = parseInt(bytes);
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

  const date = new Date(timestamp * 1000);
  return date.toISOString().split("T")[0];
}
