export type LLMRole = 'system' | 'user' | 'assistant'
export type LLMMessage = {
    role: LLMRole,
    content: string 
}

export interface ILLMClient {

    defaultModel: () => string
    models: () => string[]
    user: (content: string) => LLMMessage
    system: (content: string) => LLMMessage
    assistant: (content: string) => LLMMessage
    call: (messages: LLMMessage[], model: string, temperature: number, f: (res: string) => void ) => Promise<void> 
    stream: (messages: LLMMessage[], model: string, temperature: number, f: (res: string) => void ) => Promise<void>
}
