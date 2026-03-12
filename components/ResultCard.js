'use client';

export default function ResultCard({ data }) {
  const copyMagnet = () => {
    navigator.clipboard.writeText(data.magnet);
    alert('磁力链接已复制到剪贴板！');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {data.title}
      </h3>
      
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
        <span>📦 大小: {data.size}</span>
        <span>📅 日期: {data.date}</span>
        {data.quality && <span>🎬 {data.quality}</span>}
      </div>

      <div className="flex gap-3">
        <button
          onClick={copyMagnet}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          复制磁力链接
        </button>
        <a
          href={data.magnet}
          className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          使用下载工具打开
        </a>
      </div>
    </div>
  );
}