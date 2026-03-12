"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [aiUnderstanding, setAiUnderstanding] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'chat'
  const [copyTip, setCopyTip] = useState(""); // 复制提示

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setAiUnderstanding("");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "搜索失败");
      }

      setAiUnderstanding(data.aiUnderstanding);
      setResults(data.results);
      setActiveTab("search");
      // 搜索新内容时清空聊天历史
      setChatHistory([]);
    } catch (error) {
      console.error("搜索失败:", error);
      setAiUnderstanding(`搜索出错：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { role: "user", content: chatMessage };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatMessage,
          history: chatHistory, // ✅ 修复：传入聊天历史
          context: { lastQuery: query, results },
        }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("对话失败:", error);
      setChatHistory([
        ...updatedHistory,
        {
          role: "assistant",
          content: `出错了：${error.message}，请稍后重试。`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 修复：复制后有提示反馈，alert 体验差
  const handleCopy = (magnet, index) => {
    navigator.clipboard.writeText(magnet).then(() => {
      setCopyTip(index);
      setTimeout(() => setCopyTip(""), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 头部 */}
      <header className="backdrop-blur-md bg-white/10 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🧲</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MagnetAI
              </h1>
            </div>
            <div className="text-sm text-purple-300">AI 驱动的磁力搜索</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索框 */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词，AI 帮你找到最佳资源..."
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "🔍 搜索中..." : "🚀 搜索"}
            </button>
          </form>
        </div>

        {/* AI 理解 */}
        {aiUnderstanding && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-500/30 rounded-xl">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-sm text-purple-300 font-medium mb-1">
                  AI 分析
                </p>
                <p className="text-white whitespace-pre-wrap">
                  {aiUnderstanding}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 无结果提示 */}
        {!loading && aiUnderstanding && results.length === 0 && (
          <div className="mb-6 text-center text-purple-300 py-12">
            <p className="text-4xl mb-3">😕</p>
            <p>未找到相关资源，换个关键词试试？</p>
          </div>
        )}

        {/* Tab 切换 */}
        {results.length > 0 && (
          <div className="mb-6 flex space-x-2 bg-white/5 backdrop-blur-md p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("search")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === "search"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-purple-300 hover:text-white"
              }`}
            >
              📋 搜索结果 ({results.length})
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === "chat"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-purple-300 hover:text-white"
              }`}
            >
              💬 AI 对话
            </button>
          </div>
        )}

        {/* 内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 搜索结果 */}
          {activeTab === "search" && results.length > 0 && (
            <div className="lg:col-span-2 space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/15 hover:border-purple-500/50 transition-all group"
                >
                  <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
                    {result.title}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-sm text-purple-300 mb-4">
                    <span className="flex items-center gap-1">
                      💾 {result.size}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {result.date}
                    </span>
                    <span className="flex items-center gap-1">
                      🌐 {result.source}
                    </span>
                  </div>
                  {/* ✅ 修复：复制后显示 "已复制！" 反馈，取代 alert */}
                  <button
                    onClick={() => handleCopy(result.magnet, index)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500 hover:to-pink-500 border border-purple-500/30 hover:border-transparent rounded-lg text-purple-300 hover:text-white font-medium transition-all"
                  >
                    {copyTip === index ? "✅ 已复制！" : "📋 复制磁力链接"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI 对话 */}
          {activeTab === "chat" && (
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="h-96 overflow-y-auto mb-4 space-y-4">
                {chatHistory.length === 0 && (
                  <p className="text-center text-purple-400 mt-8">
                    👋 你好！有什么我可以帮你分析的？
                  </p>
                )}
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "bg-white/10 text-purple-100"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {/* 加载中气泡 */}
                {loading && activeTab === "chat" && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 bg-white/10 text-purple-300 rounded-2xl">
                      ✍️ AI 正在思考...
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="问 AI 任何问题..."
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={loading || !chatMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                >
                  发送
                </button>
              </form>
            </div>
          )}

          {/* 侧边栏 - 快捷提示 */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">
                  💡 快速提问
                </h3>
                <div className="space-y-2">
                  {[
                    "推荐哪个资源？",
                    "文件大小对比",
                    "最新是哪个？",
                    "画质最好的是？",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setChatMessage(q);
                        setActiveTab("chat");
                      }}
                      className="w-full px-4 py-2 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg text-purple-300 hover:text-white text-sm transition-all text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* 搜索统计 */}
              <div className="p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">
                  📊 搜索统计
                </h3>
                <p className="text-purple-300 text-sm">
                  共找到{" "}
                  <span className="text-white font-bold">{results.length}</span>{" "}
                  个资源
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
