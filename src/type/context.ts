import GitAlias from "../action/git_alias"
import { OpenAiClient } from "../llm/open-ai-client"
import type { IGitAlias } from "./git-alias-type"
import type { ILLMClient } from "./llm-types"

const client: ILLMClient = new OpenAiClient()

export const git: IGitAlias = new GitAlias(client)