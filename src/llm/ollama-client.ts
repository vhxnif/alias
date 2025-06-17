import type { ILLMClient, ILLMRequest, LLMMessage, LLMRole } from "./llm-types"
import { Ollama } from "ollama"

export class OllamaClient implements ILLMClient {
  ollama: Ollama
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    })
  }

  defaultModel = () => (process.env.OLLAMA_DEFAULT_MODEL = "deepseek-r1:1.5b")

  user = (content: string): LLMMessage => this.message("user", content)

  system = (content: string): LLMMessage => this.message("system", content)

  assistant = (content: string): LLMMessage =>
    this.message("assistant", content)

  call = async (request: ILLMRequest) => {
    const { messages, model, f } = request
    await this.ollama
      .chat({
        model,
        messages,
        stream: false,
      })
      .then((it) => f(it.message.content))
      .catch((err) => console.error(err))
  }

  stream = async (request: ILLMRequest) => {
    const { messages, model, f } = request
    const response = await this.ollama.chat({
      model,
      messages,
      stream: true,
    })
    for await (const part of response) {
      f(part.message.content)
    }
  }

  private message = (role: LLMRole, content: string): LLMMessage => ({
    role,
    content,
  })
}
