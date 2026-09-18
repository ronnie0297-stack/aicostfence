import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";

export async function research(question: string) {
  return streamText({
    model: openai("gpt-5.4-mini"),
    prompt: question,
    tools: {
      search: tool({
        description: "Search a knowledge base",
        execute: async () => ({ answer: "example" })
      })
    }
  });
}
