const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Service for generating grounded LLM answers using retrieved context via Groq
 */
const llmService = {
    /**
     * Generate an answer grounded ONLY in the provided context
     * @param {string} question User question
     * @param {Array<Object>} contextMatches Retrieved context from Pinecone
     * @returns {Promise<string>} Grounded answer
     */
    generateAnswer: async (question, contextMatches) => {
        try {
            console.log(`[LLM] Generating grounded answer via Groq for: "${question}"`);

            const contextText = contextMatches
                .map((match, index) => `Document ${index + 1} (Score: ${match.score?.toFixed(3)}):\n${match.metadata.text}`)
                .join("\n\n");

            console.log(`[LLM] Context size: ${contextText.length} characters.`);

            const systemPrompt = `
You are a senior software performance engineer.

Task:
Analyze the given performance metrics and generate concise insights.

Rules:
- Use ONLY bullet points.
- One bullet = one problem + one fix.
- Keep each bullet to EXACTLY ONE line.
- Use arrow notation (→) to connect problem and solution.
- No explanations, no disclaimers, no "not enough data".
- Make reasonable engineering assumptions if data is missing.
- Be practical, direct, and concise.
- If a fix is code-related, include the exact command or snippet in backticks (\`\`) inside the solution segment.
- No introductory or concluding text.

Output format EXACTLY:

Backend:
- <problem> → <solution>
- <problem> → <solution>

Frontend:
- <problem> → <solution>
- <problem> → <solution>

Technical:
- <problem> → <solution>
- <problem> → <solution>
`.trim();

            const userPrompt = `
Context:
${contextText || "No relevant performance data found for this session."}

Question:
${question}
`.trim();

            console.log("[LLM] Calling Groq llama-3.3-70b-versatile...");

            const response = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.1
            });

            const answer = response.choices[0].message.content;
            console.log(`[LLM] ✅ Answer generated (${answer.length} chars).`);
            return answer;
        } catch (error) {
            console.error("[LLM] ❌ Answer generation failed:", error.message);
            if (error.response) {
                console.error("[LLM] Error Details:", JSON.stringify(error.response.data || error.response, null, 2));
            }
            throw new Error("Failed to generate grounded answer");
        }
    }
};

module.exports = llmService;
