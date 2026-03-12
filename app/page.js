"use client";

import { useState } from "react";
import { Search, Loader2, Copy, Download, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const hotSearches = [
    "周星驰电影",
    "最新美剧",
    "4K电影",
    "日本动漫",
    "热门综艺",
  ];

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setResults([]);
    setAiResponse("");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        setAiResponse(data.aiUnderstanding || "");
      } else {
        alert(data.error || "搜索失败");
      }
    } catch (error) {
      console.error("搜索失败:", error);
      alert("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      alert("复制失败");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* 头部 */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              D
            </div>
            <h1 className="text-2xl font-bold text-white">AI 磁力搜索</h1>
          </div>
          <p className="text-gray-400 text-sm mt-2">智能理解，精准查找</p>
        </div>
      </header>

      {/* 主体 */}
      <main className="container mx-auto px-4 py-8">
        {/* 搜索框 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="输入想要搜索的内容..."
              className="w-full px-6 py-4 bg-gray-800 text-white rounded-2xl border-2 border-gray-700 focus:border-red-500 focus:outline-none pr-14 text-lg"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 rounded-xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Search size={20} />
              )}
            </button>
          </div>

          {/* 热门推荐 */}
          <div className="mt-4">
            <div className="text-sm text-gray-400 mb-2">热门搜索：</div>
            <div className="flex flex-wrap gap-2">
              {hotSearches.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors text-sm"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI 理解 */}
        {aiResponse && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                💡
              </div>
              <div>
                <div className="text-blue-300 font-semibold mb-1">
                  AI 智能理解
                </div>
                <div className="text-gray-300">{aiResponse}</div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {results.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              找到 {results.length} 个结果
            </h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition-colors border border-gray-700"
                >
                  <h3 className="text-white font-semibold mb-3 text-lg leading-relaxed">
                    {result.title}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      📦 {result.size}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {result.date}
                    </span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                      {result.source}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(result.magnet, index)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {copiedIndex === index ? (
                        <>
                          <CheckCircle2 size={18} />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          复制磁力链接
                        </>
                      )}
                    </button>
                    <a
                      href={result.magnet}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      使用下载工具打开
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!loading && results.length === 0 && !aiResponse && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">输入关键词开始搜索</p>
          </div>
        )}
      </main>
    </div>
  );
}
