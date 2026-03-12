export const metadata = {
  title: "AI磁力搜索 - 智能资源查找助手",
  description: "使用AI智能理解你的需求，快速找到磁力链接资源",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
