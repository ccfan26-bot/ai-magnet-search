import axios from "axios";

export async function callPoeAPI(prompt) {
  try {
    console.log("调用 Poe API...");

    const axiosConfig = {
      method: "POST",
      url: "https://api.poe.com/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${process.env.POE_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        model: "claude-sonnet-4.6",
        messages: [{ role: "user", content: prompt }],
      },
      timeout: 30000,
    };

    const response = await axios(axiosConfig);
    const aiResponse = response.data.choices?.[0]?.message?.content || "";

    console.log("✅ AI回复:", aiResponse.substring(0, 100) + "...");
    return aiResponse;
  } catch (error) {
    console.error("❌ Poe API调用失败:", error.response?.data || error.message);
    return "";
  }
}
