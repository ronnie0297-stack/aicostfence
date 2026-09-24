// Scan-only fixture: this file is inspected, never executed by the demo.
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export function research(question: string, search: any) {
  return streamText({
    model: openai("gpt-5.4-mini"),
    prompt: question,
    tools: { search }
  });
}
