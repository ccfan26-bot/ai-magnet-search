// lib/crawler.js

export async function searchMagnet(keyword, maxResults = 20) {
  console.log("🔍 搜索关键词:", keyword);

  try {
    // ✅ 修复：使用 Promise.any 取第一个有内容的结果
    //         而不是 Promise.race（race 可能返回空数组）
    const results = await Promise.any([
      searchFromBTSow(keyword).then((r) => {
        if (r.length === 0) throw new Error("BT搜无结果");
        return r;
      }),
      searchFromZhaoMagnet(keyword).then((r) => {
        if (r.length === 0) throw new Error("找磁力无结果");
        return r;
      }),
    ]).catch(async () => {
      // 两个都失败时，尝试合并两个结果（各自容错）
      console.warn("两个源均无结果，尝试合并兜底...");
      const [r1, r2] = await Promise.allSettled([
        searchFromBTSow(keyword),
        searchFromZhaoMagnet(keyword),
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

// ✅ 修复：封装带超时的 fetch
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

// 搜索源 1: BT搜
async function searchFromBTSow(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://btsow.rest/api/search?keyword=${encodeURIComponent(keyword)}&limit=20`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      10000,
    );

    if (!response.ok) throw new Error(`BT搜 API 失败: ${response.status}`);

    const data = await response.json();

    return (
      data.results?.map((item) => ({
        title: item.name || item.title || "未知标题",
        magnet: item.magnet || `magnet:?xt=urn:btih:${item.hash}`,
        size: formatSize(item.size || item.length),
        date: formatDate(item.create_time || item.date),
        source: "BT搜",
      })) || []
    );
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("BT搜请求超时");
    } else {
      console.error("BT搜搜索失败:", error.message);
    }
    return [];
  }
}

// 搜索源 2: 找磁力
async function searchFromZhaoMagnet(keyword) {
  try {
    const response = await fetchWithTimeout(
      `https://zhaomagnet.com/api/search?q=${encodeURIComponent(keyword)}&page=1`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      },
      10000,
    );

    if (!response.ok) throw new Error(`找磁力 API 失败: ${response.status}`);

    const data = await response.json();

    return (
      data.list?.map((item) => ({
        title: item.name || "未知标题",
        magnet: item.magnet,
        size: item.size || "未知",
        date: item.date || "未知",
        source: "找磁力",
      })) || []
    );
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("找磁力请求超时");
    } else {
      console.error("找磁力搜索失败:", error.message);
    }
    return [];
  }
}

// 格式化文件大小
function formatSize(bytes) {
  if (!bytes) return "未知";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = parseInt(bytes);
  if (isNaN(size)) return String(bytes); // 已经是字符串如 "1.2 GB"
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
  // 兼容时间戳（秒）和已格式化的字符串
  if (typeof timestamp === "string" && timestamp.includes("-")) {
    return timestamp.split("T")[0];
  }
  const date = new Date(Number(timestamp) * 1000);
  if (isNaN(date.getTime())) return String(timestamp);
  return date.toISOString().split("T")[0];
}
