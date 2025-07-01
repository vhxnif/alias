#!/usr/bin/env bun
import type { ChalkInstance } from "chalk"
import { Command } from "commander"
import { table, type TableUserConfig } from "table"
import { color, tableTitle } from "../utils/color-utils"
import { errParse } from "../utils/command-utils"
import { isEmpty, lines } from "../utils/common-utils"
import { default as page } from "../utils/page-prompt"
import { exec, terminal } from "../utils/platform-utils"
import { tableDataPartation, tableDefaultConfig } from "../utils/table-utils"

type GitLogCommand = {
  limit?: number
  author?: string
  from?: string
  to?: string
}

type GitLog = {
  hash: string
  date: string
  author: string
  time: string
  message: string
  ref: string[]
}

type GitLogKey = keyof GitLog

function logCommand({ limit, author, from, to }: GitLogCommand) {
  let command = `git log --oneline --format="%h│%an│%s│%ad│%D" --date=format:"%Y-%m-%d %H:%M:%S"`
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
      .map((it) => it.split("│"))
      .map((it) => {
        const [hash, author, message, datetime, refStr] = it
        const [date, time] = datetime.split(" ")
        const ref = refStr ? refStr.split(",") : []
        return {
          hash,
          author,
          message,
          date,
          time,
          ref,
        } as GitLog
      })
  return await exec(logCommand(cmd)).then(lines).then(mapToGitLog)
}

function gitLogValueFilter(logs: GitLog[], columns: GitLogKey[]): string[] {
  return logs.reduce((res, it) => {
    Object.entries(it)
      .filter((i) => columns.includes(i[0] as GitLogKey))
      .forEach((i) => {
        const v = i[1]
        if (typeof v === "string") {
          res.push(v)
        } else {
          res.push(...v)
        }
      })
    return res
  }, [] as string[])
}

function maxWidth(strs: string[]): number {
  return strs
    .map((it) => Bun.stringWidth(it))
    .reduce((res, it) => (it > res ? it : res), 0)
}

function tableConfig(tableData: GitLog[]): TableUserConfig {
  const logFilter = (columns: GitLogKey[]) =>
    gitLogValueFilter(tableData, columns)
  const columnLimit = (terminal.column > 80 ? 80 : terminal.column) - 12
  const col1 = maxWidth(logFilter(["hash", "date"]))
  const col2 = maxWidth(logFilter(["author", "time"]))
  const col3 = columnLimit - col1 - col2
  return {
    ...tableDefaultConfig,
    columns: [
      {
        alignment: "justify",
        width: col1,
      },
      {
        alignment: "justify",
        width: col2,
      },
      {
        alignment: "justify",
        width: col3,
      },
    ],
  } as TableUserConfig
}

function gitLogToTableData(logs: GitLog[]): string[][] {
  return logs.map((l) => {
    const { hash, author, message, time, date, ref } = l
    const { yellow, blue, pink, mauve } = color
    const refStr = ref.map(refParse).join("\n")
    return [
      `${yellow(hash)}\n${mauve(date)}`,
      `${blue(author)}\n${mauve(time)}`,
      !isEmpty(refStr) ? `${pink(message)}\n${refStr}` : pink(message),
    ]
  })
}

function refParse(name: string): string {
  const origin = "\u21c4"
  const head = "\u27a4"
  const local = "\u270e"
  const tag = "\u2691"
  const match = (str: string) => name.trim().startsWith(str)
  const iconShow = (icon: string, c: ChalkInstance) =>
    c(`${icon} ${name.trim()}`)
  if (match("origin")) {
    return iconShow(origin, color.sky)
  }
  if (match("HEAD ->")) {
    return iconShow(head, color.green)
  }
  if (match("tag:")) {
    return iconShow(tag, color.red)
  }
  return iconShow(local, color.peach)
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
    const data = tableDataPartation(logs).map((it) => {
      const s = gitLogToTableData(it)
      return table(
        [tableTitle(["Hash\nDate", "Author\nTime", "Message\nRef"]), ...s],
        tableConfig(it)
      )
    })
    await page({ data })
  })
  .parseAsync()
  .catch(errParse)
