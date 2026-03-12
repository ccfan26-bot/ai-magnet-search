import { NextResponse } from "next/server";
import { callPoeAPI } from "@/lib/poe-client";
import { searchMagnet } from "@/lib/crawler";

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "搜索关键词不能为空",
        },
        { status: 400 },
      );
    }

    console.log("收到搜索请求:", query);

    // AI 理解用户意图
    let aiUnderstanding = "";
    let optimizedKeywords = query;

    if (process.env.POE_API_KEY) {
      const aiPrompt = `
你是磁力搜索助手。用户输入: "${query}"

分析用户意图并提取核心关键词：
1. 影视作品: 提取片名+年份/季度（如"破晓2024"、"权力的游戏S08"）
2. 软件/游戏: 提取名称+版本号（如"Photoshop2024"）
3. 去除"下载"、"资源"、"最新"等无用词
4. 返回2-3个优化后的关键词，用空格分隔

只返回关键词，不要其他内容。
`;

      aiUnderstanding = await callPoeAPI(aiPrompt);

      // 提取 AI 返回的关键词
      if (aiUnderstanding && aiUnderstanding.trim().length > 0) {
        const keywordMatch = aiUnderstanding.match(
          /[a-zA-Z0-9\u4e00-\u9fa5]+/g,
        );
        if (keywordMatch && keywordMatch.length > 0) {
          optimizedKeywords = keywordMatch.slice(0, 3).join(" ");
        }
      }

      console.log("AI优化后的关键词:", optimizedKeywords);
    } else {
      console.warn("⚠️ 未配置 POE_API_KEY，跳过 AI 理解");
    }

    // 执行磁力搜索
    const magnetResults = await searchMagnet(optimizedKeywords || query);

    return NextResponse.json({
      success: true,
      aiUnderstanding: aiUnderstanding || `搜索: ${query}`,
      optimizedKeywords,
      results: magnetResults,
      total: magnetResults.length,
    });
  } catch (error) {
    console.error("搜索API错误:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "搜索失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
