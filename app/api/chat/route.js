import { callPoeAPI } from "@/lib/poe-client";

export async function POST(request) {
  try {
    const { message, context, history = [] } = await request.json();

    if (!message?.trim()) {
      return Response.json({ error: "消息不能为空" }, { status: 400 });
    }

    // 把历史消息拼进 prompt
    const historyText = history
      .filter((m) => m.content?.trim())
      .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
      .join("\n");

    const prompt = `你是 MagnetAI 的智能助手。用户搜索了"${context?.lastQuery || ""}"，找到了 ${context?.results?.length || 0} 个资源。

当前搜索结果：
${
  context?.results
    ?.slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.title}  大小: ${r.size} | 日期: ${r.date}`)
    .join("\n") || "暂无结果"
}

${historyText ? `对话历史：\n${historyText}\n` : ""}
用户：${message}

请用中文回答：`;

    const response = await callPoeAPI(prompt);

    if (!response) {
      return Response.json(
        { error: "AI 暂时无法回应，请稍后重试" },
        { status: 500 },
      );
    }

    return Response.json({ response });
  } catch (error) {
    console.error("Chat API 错误:", error);
    return Response.json({ error: "对话失败，请稍后重试" }, { status: 500 });
  }
}
