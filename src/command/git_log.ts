#!/usr/bin/env bun
import { Command } from "commander"
import type { ILLMClient } from "../llm/llm-types"
import { OllamaClient } from "../llm/ollama-client"
import { OpenAiClient } from "../llm/open-ai-client"
import { color } from "../utils/color-utils"
import { errParse, isEmpty, lines } from "../utils/common-utils"
import type { GitLog, GitLogConfig } from "../utils/git-log-prompt"
import { default as gitLog } from "../utils/git-log-prompt"
import { Spinner } from "../utils/ora-utils"
import { exec, resetTTY } from "../utils/platform-utils"
import { gitDiffSummary } from "../utils/prompt"
import { gitDiffParse } from "../utils/git-diff-format"
import { default as page } from "../utils/page-prompt"

type GitLogCommand = {
  limit?: number
  author?: string
  from?: string
  to?: string
}

const logItemJoin = "│"
const logItemEnd = "┼"

function logCommand({ limit, author, from, to }: GitLogCommand) {
  const format: string[] = ["%h", "%an", "%s", "%ad", "%D", "%b", "%H", "%cr"]
  let command = `git log --oneline --format="${
    format.join(logItemJoin) + logItemEnd
  }" --date=format:"%Y-%m-%d %H:%M:%S"`
  const initCommand = command
  if (limit) {
    command = `${command} -n ${limit}`
  }
  if (author) {
    command = `${command} --author=${author} -n ${limit}`
  }
  if (from) {
    command = `${command} --since="${from}"`
  }
  if (to) {
    command = `${command} --before="${to}"`
  }
  if (initCommand == command) {
    command = `${command} -n ${limit}`
  }
  return command
}

async function gitLogs(cmd: GitLogCommand): Promise<GitLog[]> {
  const mapToGitLog = (strs: string[]) =>
    strs
      .map((it) => it.split(logItemJoin))
      .map((it) => {
        const [
          hash,
          author,
          message,
          datetime,
          refStr,
          body,
          commitHash,
          humanDate,
        ] = it
        const [date, time] = datetime.split(" ")
        const ref = refStr ? refStr.split(",") : []
        return {
          hash,
          author,
          message,
          date,
          time,
          ref,
          body,
          commitHash,
          humanDate,
        } as GitLog
      })
  const sp = (str: string) => lines(str, logItemEnd)
  return await exec(logCommand(cmd)).then(sp).then(mapToGitLog)
}

const client: ILLMClient =
  process.env.GIT_ALIAS === "ollama" ? new OllamaClient() : new OpenAiClient()

const codeReview = async (commitHash: string) => {
  const diff = await exec(`git show ${commitHash}`)
  const spinner = new Spinner(color.blue.bold("Summary...")).start()
  await client.stream({
    messages: [client.system(gitDiffSummary), client.user(diff)],
    model: client.defaultModel(),
    f: async (str: string) => {
      spinner.succeed(color.green.bold("Success."))
      process.stdout.write(color.green(str))
    },
  })
}

const commitDiff = async (hash: string) => {
  const res = await exec(`git log -1 ${hash} --pretty=%P`)
  const pHash = res.split(" ")[0]
  const diffStr = await exec(`git diff ${pHash} ${hash}`)
  gitDiffParse(diffStr).forEach((it) => console.log(it))
  // await page({ data: diffShows, quiteClear: true })
}

new Command()
  .name("gl")
  .description("git log -n, defaule limit is 100")
  .option("-l, --limit <limit>")
  .option("-a, --author <author>")
  .option("-f, --from <from>", "yyyy-MM-dd")
  .option("-t, --to <to>", "yyyy-MM-dd")
  .action(async (option) => {
    const { limit, author, from, to } = option
    const logLimit = limit ?? 100
    const logs = await gitLogs({ limit: logLimit, author, from, to })
    if (isEmpty(logs)) {
      throw Error(`Git Logs Missing.`)
    }
    const loopCall = async (cf: GitLogConfig) => {
      const { type, config } = await gitLog(cf)
      const { data, pageIndex, rowIndex, pageSize } = config
      const { commitHash } = data[pageIndex! * pageSize! + rowIndex!]
      if (type === "AI_SUMMARY") {
        await codeReview(commitHash)
        console.log()
      }
      if (type === "COMMIT_DIFF") {
        await commitDiff(commitHash)
      }
      await loopCall(config)
    }
    await loopCall({ data: logs })
  })
  .parseAsync()
  .catch(errParse)
