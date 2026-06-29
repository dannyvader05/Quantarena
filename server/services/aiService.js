const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getStockInsight = async (symbol, companyName) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(
    `Give a concise 3-sentence summary for a retail investor about ${companyName} (${symbol}). Cover what the company does, and general sentiment/context. Do not give financial advice or price predictions. Keep it factual and brief.`
  );

  return result.response.text();
};

module.exports = { getStockInsight };