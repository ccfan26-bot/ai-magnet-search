'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Download, Copy, Send, Sparkles, MessageSquare } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [aiUnderstanding, setAiUnderstanding] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef(null);
  const searchBoxRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSearch = async (searchQuery) => {
    const trimmedQuery = searchQuery?.trim();
    if (!trimmedQuery) return;

    setLoading(true);
    setResults([]);
    setAiUnderstanding('');
    setShowChat(false);
    setChatMessages([]);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setAiUnderstanding(data.aiUnderstanding);
        setShowChat(true);
        
        // 初始化对话历史
        setChatMessages([
          {
            role: 'assistant',
            content: `${data.aiUnderstanding}\n\n我为你找到了 ${data.results.length} 个资源。你可以问我：\n• 哪个资源质量最好？\n• 推荐下载哪一个？\n• 这些资源有什么区别？`
          }
        ]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            lastQuery: query,
            results: results.map(r => ({
              title: r.title,
              size: r.size,
              date: r.date,
              source: r.source
            })),
            aiUnderstanding
          }
        }),
      });

      const data = await response.json();
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      console.error('对话失败:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ 抱歉，我遇到了问题，请稍后重试'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyMagnet = (magnet) => {
    navigator.clipboard.writeText(magnet);
    const notification = document.createElement('div');
    notification.className = 'fixed top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl z-[100] animate-slide-down flex items-center gap-3 font-medium';
    notification.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>磁力链接已复制到剪贴板</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('animate-slide-up');
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* 主容器 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* 头部区域 */}
        <div className={`flex-shrink-0 transition-all duration-700 ${results.length > 0 ? 'pt-12 pb-8' : 'pt-32 pb-16'}`}>
          <div className="container mx-auto px-6 max-w-5xl">
            
            {/* Logo 和标题 */}
            <div className={`text-center mb-12 transition-all duration-700 ${results.length > 0 ? 'scale-90' : 'scale-100'}`}>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
                  <Sparkles className="text-white" size={32} />
                </div>
                <h1 className="text-7xl font-black">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                    MagnetAI
                  </span>
                </h1>
              </div>
              <p className="text-gray-300 text-xl font-light">
                AI 驱动的智能磁力搜索引擎
              </p>
            </div>

            {/* 超大搜索框 */}
            <div ref={searchBoxRef} className="relative group">
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  handleSearch(query); 
                }} 
              >
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="描述你想要的资源，例如：4K 周星驰电影合集..."
                    className="w-full px-8 py-7 pr-24 text-xl bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/30 outline-none transition-all shadow-2xl group-hover:shadow-purple-500/20"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>搜索中</span>
                      </>
                    ) : (
                      <>
                        <Search size={24} />
                        <span>搜索</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* 搜索提示 */}
              {!results.length && !loading && (
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  {['周星驰电影 4K', 'Python 入门教程', '权力的游戏 全集', '红楼梦 有声书'].map((tip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(tip)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all text-sm backdrop-blur-sm hover:scale-105"
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 搜索结果区域 */}
        {results.length > 0 && (
          <div className="flex-1 pb-8">
            <div className="container mx-auto px-6 max-w-5xl">
              
              {/* 结果统计 */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">{results.length}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">找到 {results.length} 个资源</h2>
                    <p className="text-gray-400 text-sm mt-1">已为你筛选出最优结果</p>
                  </div>
                </div>
              </div>

              {/* 结果列表 */}
              <div className="space-y-4 mb-8">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className="group bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1"
                  >
                    {/* 序号和标题 */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                          {result.title}
                        </h3>
                        
                        {/* 元信息 */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-2 text-gray-300">
                            <span className="text-xl">📦</span>
                            <span className="font-medium">{result.size}</span>
                          </span>
                          <span className="flex items-center gap-2 text-gray-300">
                            <span className="text-xl">📅</span>
                            <span>{result.date}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-xl">🔗</span>
                            <span className="text-purple-400 font-medium">{result.source}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-3 ml-14">
                      <button
                        onClick={() => copyMagnet(result.magnet)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all font-semibold hover:scale-105"
                      >
                        <Copy size={18} />
                        复制链接
                      </button>
                      <a
                        href={result.magnet}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 hover:border-white/40 transition-all font-semibold hover:scale-105"
                      >
                        <Download size={18} />
                        立即下载
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <Loader2 className="w-24 h-24 text-purple-500 animate-spin" />
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <p className="text-2xl text-white font-semibold mb-2">AI 正在搜索中...</p>
              <p className="text-gray-400">请稍候，为你找最好的资源</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部对话框 */}
      {showChat && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t-2 border-white/10 shadow-2xl z-50">
          <div className="container mx-auto max-w-5xl">
            
            {/* 对话历史 */}
            <div className="max-h-96 overflow-y-auto px-6 py-6">
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] px-6 py-4 rounded-2xl shadow-xl ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                          : 'bg-white/10 backdrop-blur-xl text-gray-100 border border-white/20'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={16} className="text-purple-400" />
                          <span className="text-xs font-semibold text-purple-400">AI 助手</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/20">
                      <Loader2 className="animate-spin text-purple-400" size={20} />
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="px-6 py-6 border-t border-white/10">
              <form onSubmit={handleChatSubmit} className="flex gap-4">
                <div className="flex-1 relative">
                  <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="问问 AI，或描述新的搜索需求..."
                    className="w-full pl-14 pr-6 py-5 text-lg bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/30 outline-none transition-all"
                    disabled={chatLoading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-3"
                >
                  {chatLoading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Send size={24} />
                      <span>发送</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}