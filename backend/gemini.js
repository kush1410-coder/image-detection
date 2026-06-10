const axios = require("axios");
const fs = require("fs");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const imageToBase64 = (filePath) => {
    const image = fs.readFileSync(filePath);
    return image.toString("base64");
};

const analyzeImage = async (imagePath) => {
    try {
        if (!GEMINI_API_KEY) {
            console.log("❌ Gemini API key missing");
            throw new Error("Missing Gemini API key");
        }

        console.log("🔑 Using API KEY:", GEMINI_API_KEY.substring(0, 10) + "...");

        const base64Image = imageToBase64(imagePath);

        const prompt = `
Analyze this image and return ONLY JSON.

{
  "entity": "main subject name",
  "queries": ["q1","q2","q3","q4","q5"]
}

Rules:
- No markdown
- No explanation
- Only valid JSON
`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg",
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ]
            }
        );

        let text =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("🧠 Gemini raw response:", text);

        // 🔥 CLEAN MARKDOWN
        text = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        let parsed;

        try {
            parsed = JSON.parse(text);
        } catch (err) {
            console.log("⚠️ JSON parse failed, fallback used");

            return {
                entity: "unknown",
                queries: [
                    "football player",
                    "sports image",
                    "match highlight",
                    "stadium action"
                ]
            };
        }

        return {
            entity: parsed.entity || "unknown",
            queries: parsed.queries || []
        };

    } catch (err) {
        console.error("❌ Gemini error:", err.response?.data || err.message);

        return {
            entity: "unknown",
            queries: [
                "football player",
                "sports image",
                "match highlight",
                "stadium action"
            ]
        };
    }
};

module.exports = { analyzeImage };
