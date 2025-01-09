import OpenAi from "openai"
import type { ILLMClient, LLMMessage, LLMRole } from "../type/llm-types"
import { config } from "../utils/constant"

export class OpenAiClient implements ILLMClient {
  client: OpenAi

  constructor() {
    this.client = new OpenAi({
      baseURL: config.baseUrl,
      apiKey: config.apiKey,
    })
  }

  defaultModel = () => config.defaultModel

  models = () => [config.defaultModel]

  user = (content: string): LLMMessage => this.message("user", content)

  system = (content: string): LLMMessage => this.message("system", content)

  assistant = (content: string): LLMMessage =>
    this.message("assistant", content)

  call = async (
    messages: LLMMessage[],
    model: string,
    temperature: number,
    f: (res: string) => void,
  ) => {
    await this.client.chat.completions
      .create({
        messages: messages,
        model: model,
        temperature,
      })
      .then((it) => f(it.choices[0]?.message?.content ?? ""))
      .catch((err) => console.error(err))
  }
  stream = async (
    messages: LLMMessage[],
    model: string,
    temperature: number,
    f: (res: string) => void,
  ) => {
    const stream = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      temperature,
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
