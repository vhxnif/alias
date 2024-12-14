export const temperature: Record<string, [string, number]> = {
    'codeOrMath': ['Code / Math', 0.0],
    'data':['Data Analysis', 1.0], 
    'general': ['General Conversation', 1.3],
    'translate': ['Translate', 1.3],
    'writting': ['Creative Writing / Poetry Composition', 1.5],
}

export const config = {
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.deepseek.com',
    apiKey: process.env.OPENAI_API_KEY!,
    defaultModel: process.env.OPENAI_DEFAULT_MODEL ?? 'deepseek-chat',
}
