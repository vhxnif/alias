export type LLMRole = "system" | "user" | "assistant"
export type LLMMessage = {
  role: LLMRole
  content: string
}

export type ILLMRequest = {
  messages: LLMMessage[]
  model: string
  f: (res: string) => void
}

export interface ILLMClient {
  defaultModel: () => string
  user: (content: string) => LLMMessage
  system: (content: string) => LLMMessage
  assistant: (content: string) => LLMMessage
  call: (request: ILLMRequest) => Promise<void>
  stream: (request: ILLMRequest) => Promise<void>
}
