import OpenAi from "openai"
import type { ILLMClient, ILLMRequest, LLMMessage, LLMRole } from "./llm-types"

const temperature: Record<string, [string, number]> = {
  codeOrMath: ["Code / Math", 0.0],
  data: ["Data Analysis", 1.0],
  general: ["General Conversation", 1.3],
  translate: ["Translate", 1.3],
  writting: ["Creative Writing / Poetry Composition", 1.5],
}

export class OpenAiClient implements ILLMClient {
  client: OpenAi

  constructor() {
    this.client = new OpenAi({
      baseURL: process.env.ALIAS_BASE_URL!,
      apiKey: process.env.ALIAS_API_KEY!,
    })
  }

  defaultModel = () => process.env.ALIAS_DEFAULT_MODEL ?? ""

  user = (content: string): LLMMessage => this.message("user", content)

  system = (content: string): LLMMessage => this.message("system", content)

  assistant = (content: string): LLMMessage =>
    this.message("assistant", content)

  call = async (request: ILLMRequest) => {
    const { messages, model, f } = request
    await this.client.chat.completions
      .create({
        messages,
        model,
        temperature: temperature.codeOrMath[1],
      })
      .then((it) => f(it.choices[0]?.message?.content ?? ""))
      .catch((err) => console.error(err))
  }
  stream = async (request: ILLMRequest) => {
    const { messages, model, f } = request
    const stream = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: temperature.codeOrMath[1],
      stream: true,
    })
    for await (const part of stream) {
      f(part.choices[0]?.delta?.content || "")
    }
  }

  private message = (role: LLMRole, content: string): LLMMessage => ({
    role,
    content,
  })
}
