// lib/crawler.js

export async function searchMagnet(keyword, maxResults = 20) {
  console.log("搜索关键词:", keyword);

  try {
    // 简化版：直接返回模拟数据（后续可以接入真实 API）
    return getFallbackResults(keyword, maxResults);
  } catch (error) {
    console.error("❌ 搜索失败:", error.message);
    return getFallbackResults(keyword, maxResults);
  }
}

// 生成模拟数据
function getFallbackResults(keyword, maxResults = 20) {
  const results = [];
  const sizes = ["1.2 GB", "2.5 GB", "4.8 GB", "720 MB", "8.3 GB", "3.1 GB"];
  const dates = [
    "2024-03-12",
    "2024-03-11",
    "2024-03-10",
    "2024-03-09",
    "2024-03-08",
  ];
  const sources = ["BT天堂", "RARBG", "海盗湾", "磁力猫", "Torrentz2"];

  for (let i = 0; i < maxResults; i++) {
    const hash = generateRandomHash();
    results.push({
      title: `${keyword} - ${["高清版", "完整版", "蓝光版", "中文字幕", "4K版", "合集", "精修版"][i % 7]}`,
      magnet: `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(keyword)}`,
      size: sizes[i % sizes.length],
      date: dates[i % dates.length],
      source: sources[i % sources.length],
    });
  }

  return results;
}

// 生成随机磁力链接哈希
function generateRandomHash() {
  const chars = "0123456789ABCDEF";
  let hash = "";
  for (let i = 0; i < 40; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}
