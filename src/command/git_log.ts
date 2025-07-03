#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { isEmpty, lines } from "../utils/common-utils"
import type { GitLog } from "../utils/git-log-prompt"
import { default as page } from "../utils/git-log-prompt"
import { exec } from "../utils/platform-utils"

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
    await page({ data: logs })
  })
  .parseAsync()
  .catch(errParse)
