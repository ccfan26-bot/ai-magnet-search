export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { callPoeAPI } from "@/lib/poe-client";

export async function POST(request) {
  try {
    const { message, context } = await request.json();

    const prompt = `
你是AI磁力搜索助手。用户正在与你对话。

上下文信息：
- 上次搜索关键词: ${context.lastQuery || "无"}
- 搜索结果数量: ${context.resultsCount || 0}
- AI理解: ${context.aiUnderstanding || "无"}

用户新消息: "${message}"

请根据上下文回答用户的问题。如果用户想重新搜索，提取关键词并告知。保持简洁友好。
`;

    const response = await callPoeAPI(prompt);

    return NextResponse.json({
      success: true,
      response: response || "抱歉，我暂时无法理解你的问题，请换个方式描述。",
    });
  } catch (error) {
    console.error("对话API错误:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
