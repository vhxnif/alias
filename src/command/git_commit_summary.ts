#!/usr/bin/env bun
import { Command } from "commander"
import type { ILLMClient } from "../llm/llm-types"
import { OllamaClient } from "../llm/ollama-client"
import { OpenAiClient } from "../llm/open-ai-client"
import { color } from "../utils/color-utils"
import { errParse } from "../utils/common-utils"
import { Spinner } from "../utils/ora-utils"
import { exec } from "../utils/platform-utils"
import { gitLogSummary } from "../utils/prompt"

const client: ILLMClient =
  process.env.ALIAS_TYPE === "ollama" ? new OllamaClient() : new OpenAiClient()

new Command()
  .name("gcs")
  .description("git commit summary")
  .option("-a, --author <author>")
  .option("-f, --from <from>", "yyyy-MM-dd")
  .option("-t, --to <to>", "yyyy-MM-dd")
  .action(async (option) => {
    const { author, from, to } = option
    const spinner = new Spinner(color.blue.bold("Summary...")).start()
    let command = `git log --format="%s\n%b"`
    if (author) {
      command = `${command} --author="${author}"`
    }
    if (from) {
      command = `${command} --since="${from}"`
    }
    if (to) {
      command = `${command} --before="${to}"`
    }
    const commits = await exec(command)
    await client.stream({
      messages: [client.system(gitLogSummary), client.user(commits)],
      model: client.defaultModel(),
      f: async (str: string) => {
        spinner.succeed(color.green.bold("Success."))
        process.stdout.write(str)
      },
    })
  })
  .parseAsync()
  .catch(errParse)
