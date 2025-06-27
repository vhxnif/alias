#!/usr/bin/env bun
import { Command } from "commander"
import ora from "ora"
import { execPrint, stagedFile } from "../action/git-common-action"
import { OllamaClient } from "../llm/ollama-client"
import { OpenAiClient } from "../llm/open-ai-client"
import type { ILLMClient } from "../llm/llm-types"
import { color } from "../utils/color-utils"
import { isEmpty, printErr } from "../utils/common-utils"
import { editor, exec } from "../utils/platform-utils"
import { gitCommitMessage } from "../utils/prompt"

const client: ILLMClient =
  process.env.ALIAS_TYPE === "ollama" ? new OllamaClient() : new OpenAiClient()

async function commitWithMessage() {
  const spinner = ora(color.blue.bold("Extract Git Diff...")).start()
  const diff = await exec(`git diff --staged`)
  spinner.text = color.mauve.bold("Analyzing...")
  await client.call({
    messages: [client.system(gitCommitMessage), client.user(diff)],
    model: client.defaultModel(),
    f: async (str: string) => {
      spinner.succeed(color.green.bold("Summary completed!!!"))
      await editor(
        str,
        async (tmpPath) => await execPrint(`git commit -F "${tmpPath}"`),
      )
    },
  })
}

new Command()
  .name("gc")
  .description("git commit -m")
  .option("-m, --message <message>", "commit message not use ai summary")
  .action(async (options) => {
    const { message } = options
    const stageFile = await stagedFile()
    if (isEmpty(stageFile)) {
      printErr("No Staged Changes To Commit.")
      return
    }
    if (message) {
      await execPrint(`git commit -m "${message}"`)
      return
    }
    await commitWithMessage()
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
