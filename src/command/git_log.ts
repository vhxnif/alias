#!/usr/bin/env bun
import type { ChalkInstance } from "chalk"
import { Command } from "commander"
import type { TableUserConfig } from "table"
import { lines, pageTable } from "../action/git-common-action"
import { color } from "../utils/color-utils"
import { exec, terminal } from "../utils/platform-utils"
import { tableDefaultConfig } from "../utils/table-utils"
import { isEmpty } from "../utils/common-utils"

function logCommand(
  limit?: number,
  author?: string,
  from?: string,
  to?: string
) {
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

function logTableConfig(tableData: string[][]) {
  const data = tableData.reduce(
    (arr, it) => {
      const hashAndDate = it[0]
      const authorAndTime = it[1]
      arr[0].push(...hashAndDate.split("\n"))
      arr[1].push(...authorAndTime.split("\n"))
      return arr
    },
    [[], []] as string[][]
  )
  const maxWidth = (strs: string[]) =>
    strs
      .map((it) => Bun.stringWidth(it))
      .reduce((res, it) => (it > res ? it : res), 0)
  const columnLimit = (terminal.column > 80 ? 80 : terminal.column) - 12
  const col1 = maxWidth(data[0])
  const col2 = maxWidth(data[1])
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

function logParse(str: string[]) {
  const l = str.map((s) => s.trim())
  const hash = color.yellow(l[0])
  const author = color.blue(l[1])
  const message = color.pink(l[2])
  const dateTime = l[3].split(" ")
  const date = color.mauve(dateTime[0])
  const time = color.mauve(dateTime[1])
  const ref = l[4]
    .split(",")
    .filter((it) => it)
    .map(refParse)
    .join("\n")
  return [
    `${hash}\n${date}`,
    `${author}\n${time}`,
    ref ? `${message}\n${ref}` : message,
  ]
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
    const logs = await exec(logCommand(logLimit, author, from, to)).then(lines)
    if (isEmpty(logs)) {
      return
    }
    await pageTable({
      titleStr: ["Hash\nDate", "Author\nTime", "Message\nRef"],
      data: logs.map((it) => it.split("│")),
      config: logTableConfig,
      rowParse: logParse,
    })
  })
  .parseAsync()
