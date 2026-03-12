import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { message, context } = await request.json();

    const systemPrompt = `你是 MagnetAI 的智能助手。用户刚刚搜索了"${context.lastQuery}"，找到了 ${context.results?.length || 0} 个资源。

当前搜索结果：
${context.results
  ?.slice(0, 5)
  .map(
    (r, i) =>
      `${i + 1}. ${r.title}\n   大小: ${r.size} | 日期: ${r.date} | 来源: ${r.source}`,
  )
  .join("\n\n")}

请根据用户的问题，提供专业、友好的回答。如果用户问推荐，请分析文件大小、日期、标题等信息给出建议。`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      system: systemPrompt,
    });

    return Response.json({
      response: response.content[0].text,
    });
  } catch (error) {
    console.error("Chat API 错误:", error);
    return Response.json({ error: "对话失败，请稍后重试" }, { status: 500 });
  }
}
