import { GoogleGenerativeAI } from "@google/generative-ai"

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"

function getClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) throw new Error("Missing GOOGLE_GEMINI_API_KEY")
  return new GoogleGenerativeAI(apiKey)
}

export async function summarizeLargeText(text: string, userPrompt?: string) {
  const genai = getClient()
  const model = genai.getGenerativeModel({ model: MODEL })

  const baseInstruction =
    userPrompt?.trim() ||
    "Summarize the document into clear, concise bullet points with headings and actionable insights. Include key terms and definitions where relevant."

  // Simple chunking to stay within limits
  const chunks: string[] = []
  const maxChunk = 8000 // characters per chunk
  for (let i = 0; i < text.length; i += maxChunk) {
    chunks.push(text.slice(i, i + maxChunk))
  }

  if (chunks.length === 0) return "No content to summarize."

  const partials: string[] = []
  for (const [idx, chunk] of chunks.entries()) {
    const prompt = `${baseInstruction}\n\nChunk ${idx + 1} of ${chunks.length} (do not repeat previous content).\n\n---\n${chunk}`
    const resp = await model.generateContent(prompt)
    const out = await resp.response.text()
    partials.push(out)
  }

  // Final synthesis
  const finalPrompt = `Combine and refine the following partial summaries into a single, non-redundant executive summary with bullet points and section headers. Keep it under 400-600 words.\n\n${partials.join("\n\n")}\n\nReturn only the final summary.`
  const final = await model.generateContent(finalPrompt)
  return final.response.text()
}
