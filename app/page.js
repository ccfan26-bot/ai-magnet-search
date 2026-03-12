"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Loader2,
  Download,
  Copy,
  MessageCircle,
  Send,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiUnderstanding, setAiUnderstanding] = useState("");
  const [showChatHistory, setShowChatHistory] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (showChatHistory) scrollToBottom();
  }, [chatMessages, showChatHistory]);

  const handleSearch = async (searchQuery, isFromChat = false) => {
    const trimmedQuery = searchQuery?.trim();
    if (!trimmedQuery) return;

    setLoading(true);
    setResults([]);
    setAiUnderstanding("");

    if (isFromChat) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: trimmedQuery,
        },
      ]);
    }

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuery }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setAiUnderstanding(data.aiUnderstanding);

        if (isFromChat) {
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `${data.aiUnderstanding}\n\n找到 ${data.results.length} 个结果`,
            },
          ]);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("搜索失败:", error);

      if (isFromChat) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ 搜索失败: ${error.message}`,
          },
        ]);
      } else {
        alert("搜索失败: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;

    setChatInput("");

    // 判断是新搜索还是追问
    const isSearchIntent =
      results.length === 0 ||
      message.includes("搜索") ||
      message.includes("找") ||
      message.includes("要") ||
      message.length > 10;

    if (isSearchIntent) {
      await handleSearch(message, true);
    } else {
      // 追问
      setChatMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: message,
        },
      ]);

      setLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            context: {
              lastQuery: query,
              resultsCount: results.length,
              aiUnderstanding,
            },
          }),
        });

        const data = await response.json();

        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
          },
        ]);
      } catch (error) {
        console.error("对话失败:", error);
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ 抱歉，我遇到了问题，请稍后重试",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const copyMagnet = (magnet, title) => {
    navigator.clipboard.writeText(magnet);
    // 使用更友好的提示
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
    notification.textContent = "✓ 磁力链接已复制";
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* 主内容区域 */}
      <div className="container mx-auto px-4 py-8 pb-40">
        {/* 顶部标题 */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              AI 磁力搜索
            </span>
          </h1>
          <p className="text-gray-600 text-xl">智能理解，精准查找</p>
        </div>

        {/* 搜索框 */}
        <div className="max-w-3xl mx-auto mb-12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="relative"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="描述你想要的资源，例如：周星驰电影、Python教程..."
              className="w-full px-6 py-5 pr-16 text-lg rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Search size={24} />
              )}
            </button>
          </form>
        </div>

        {/* AI 理解提示 */}
        {aiUnderstanding && !loading && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-md border border-purple-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold">AI</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {aiUnderstanding}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="animate-spin mx-auto text-purple-600 w-16 h-16 mb-4" />
            <p className="text-gray-600 text-lg">正在为你搜索...</p>
          </div>
        )}

        {/* 搜索结果 */}
        {!loading && results.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                共找到 <span className="text-purple-600">{results.length}</span>{" "}
                个结果
              </h2>
            </div>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100"
                >
                  {/* 标题 */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                    {result.title}
                  </h3>

                  {/* 元信息 */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1.5">
                      <span className="text-lg">📦</span>
                      <span>{result.size}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-lg">📅</span>
                      <span>{result.date}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-lg">🔗</span>
                      <span className="text-purple-600 font-medium">
                        {result.source}
                      </span>
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => copyMagnet(result.magnet, result.title)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      <Copy size={18} />
                      复制链接
                    </button>
                    <a
                      href={result.magnet}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      <Download size={18} />
                      打开下载
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 无结果提示 */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600 mb-2">未找到相关资源</p>
            <p className="text-gray-500">
              试试换个关键词，或者在底部对话框中详细描述你的需求
            </p>
          </div>
        )}
      </div>

      {/* 底部固定对话框 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-purple-200 shadow-2xl z-50">
        <div className="container mx-auto max-w-5xl">
          {/* 对话历史（可折叠） */}
          {chatMessages.length > 0 && showChatHistory && (
            <div className="max-h-80 overflow-y-auto p-6 border-b border-gray-200">
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div ref={chatEndRef} />
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-6">
            <div className="flex items-center gap-3">
              {/* 折叠按钮 */}
              {chatMessages.length > 0 && (
                <button
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  className="p-3 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                  title={showChatHistory ? "收起对话" : "展开对话"}
                >
                  {showChatHistory ? (
                    <ChevronDown size={22} />
                  ) : (
                    <ChevronUp size={22} />
                  )}
                </button>
              )}

              {/* 输入框 */}
              <form onSubmit={handleChatSubmit} className="flex-1 flex gap-3">
                <div className="flex-1 relative">
                  <MessageCircle
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="继续对话，或描述你的新需求..."
                    className="w-full pl-12 pr-4 py-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <Send size={22} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
