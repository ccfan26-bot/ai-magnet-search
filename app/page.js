"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Loader2,
  Download,
  Copy,
  MessageCircle,
  Send,
  X,
} from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiUnderstanding, setAiUnderstanding] = useState("");
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSearch = async (searchQuery, isFromChat = false) => {
    if (!searchQuery?.trim()) return;

    setLoading(true);
    setResults([]);
    setAiUnderstanding("");

    if (isFromChat) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: searchQuery,
        },
      ]);
    }

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
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
              results: data.results,
            },
          ]);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("搜索失败:", error);
      alert("搜索失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const message = chatInput.trim();
    setChatInput("");

    // 判断是新搜索还是追问
    if (
      results.length === 0 ||
      message.includes("搜索") ||
      message.includes("找")
    ) {
      await handleSearch(message, true);
    } else {
      // 追问处理
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
      } finally {
        setLoading(false);
      }
    }
  };

  const copyMagnet = (magnet) => {
    navigator.clipboard.writeText(magnet);
    alert("磁力链接已复制！");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-32">
      {/* 头部 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
            AI 磁力搜索
          </h1>
          <p className="text-gray-600 text-lg">智能理解，精准查找</p>
        </div>

        {/* 搜索框 */}
        <div className="max-w-3xl mx-auto mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="描述你想找的内容，比如：黑泽清的最新电影..."
              className="flex-1 px-6 py-4 rounded-full border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-lg shadow-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:shadow-xl transition-all disabled:opacity-50 font-semibold"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
            </button>
          </form>
        </div>

        {/* AI 理解 */}
        {aiUnderstanding && (
          <div className="max-w-3xl mx-auto mb-8 p-6 bg-white rounded-2xl shadow-lg border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">AI</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {aiUnderstanding}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto text-purple-600 w-12 h-12" />
            <p className="text-gray-600 mt-4">正在搜索中...</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              找到 {results.length} 个结果
            </h2>
            <div className="grid gap-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {result.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      📦 {result.size}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {result.date}
                    </span>
                    <span className="flex items-center gap-1">
                      🔗 {result.source}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyMagnet(result.magnet)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <Copy size={16} />
                      复制磁力链接
                    </button>
                    <a
                      href={result.magnet}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Download size={16} />
                      使用下载工具打开
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">未找到相关结果</p>
            <p className="text-sm mt-2">
              试试换个关键词，或者在底部对话框中描述你的需求
            </p>
          </div>
        )}
      </div>

      {/* 底部对话框 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-purple-200 shadow-2xl">
        <div className="container mx-auto max-w-4xl">
          {/* 对话历史（可折叠） */}
          {showChat && chatMessages.length > 0 && (
            <div className="max-h-96 overflow-y-auto p-4 border-b">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* 输入框 */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              {chatMessages.length > 0 && (
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                  title={showChat ? "折叠对话" : "展开对话"}
                >
                  {showChat ? <X size={20} /> : <MessageCircle size={20} />}
                </button>
              )}

              <form onSubmit={handleChatSubmit} className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="继续对话，或描述你的需求..."
                  className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-full focus:border-purple-500 focus:outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
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
