// lib/poe-client.js

export async function callPoeAPI(prompt) {
  try {
    console.log("调用 Poe API...");

    const response = await fetch("https://api.poe.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.POE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4.6",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";

    console.log("✅ AI回复:", aiResponse.substring(0, 100) + "...");
    return aiResponse;
  } catch (error) {
    console.error("❌ Poe API调用失败:", error.message);
    return "";
  }
}
