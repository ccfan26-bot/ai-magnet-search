export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { callPoeAPI } from "@/lib/poe-client";
import { searchMagnet } from "@/lib/crawler";

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "搜索关键词不能为空" },
        { status: 400 },
      );
    }

    console.log("收到搜索请求:", query);

    let aiUnderstanding = "";
    let optimizedKeywords = query.trim();

    if (process.env.POE_API_KEY) {
      try {
        const aiPrompt = `
用户输入: "${query}"

你是磁力搜索助手，请：
1. 理解用户意图
2. 提取2-3个核心搜索关键词
3. 给出友好的理解说明

格式：
理解：[你对用户需求的理解]
关键词：[关键词1 关键词2]
`;
        const aiResponse = await callPoeAPI(aiPrompt);
        if (aiResponse) {
          aiUnderstanding = aiResponse;
          const keywordMatch = aiResponse.match(/关键词[：:]\s*(.+)/);
          if (keywordMatch) {
            optimizedKeywords = keywordMatch[1].trim();
          }
        }
      } catch (aiError) {
        // AI 分析失败不影响搜索继续
        console.warn("AI 分析失败，使用原始关键词:", aiError.message);
      }
    }

    const magnetResults = await searchMagnet(optimizedKeywords);

    return NextResponse.json({
      success: true,
      aiUnderstanding: aiUnderstanding || `正在搜索: ${query}`,
      optimizedKeywords,
      results: magnetResults,
      total: magnetResults.length,
    });
  } catch (error) {
    console.error("搜索API错误:", error);
    return NextResponse.json(
      { success: false, error: error.message || "搜索失败，请稍后重试" },
      { status: 500 },
    );
  }
}
