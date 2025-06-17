import { configPath, exec } from "../utils/platform-utils"
import { isEmpty, printCmdLog, printErr } from "../utils/common-utils"
import { checkbox, select } from "@inquirer/prompts"
import { table, type TableUserConfig } from "table"
import { color } from "../utils/color-utils"
import { default as page } from "../utils/page-prompt"
import path from "path"
import type { ChalkInstance } from "chalk"

export type ShortLog = {
  stageStatus: string
  workStatus: string
  filePath: string
}

async function statusShortLog(): Promise<ShortLog[]> {
  const lines = await exec("git status -sunormal")
    .then((it) => it.split("\n"))
    .then((it) => it.filter((l) => !isEmpty(l)))
  if (isEmpty(lines)) {
    return []
  }
  return lines.map((it) => ({
    stageStatus: it.substring(0, 1),
    workStatus: it.substring(1, 2),
    filePath: it.substring(3),
  }))
}

async function changedFile(): Promise<ShortLog[]> {
  return await statusShortLog().then((it) =>
    it.filter((lg) => lg.workStatus !== " "),
  )
}

async function stagedFile(): Promise<ShortLog[]> {
  return await statusShortLog().then((it) =>
    it.filter((lg) => ![" ", "?"].includes(lg.stageStatus)),
  )
}

function shortLogFileChoices(
  logs: ShortLog[],
): { name: string; value: string }[] {
  return logs.map((it) => ({
    name: it.filePath,
    value: it.filePath,
  }))
}

async function batchFileAction(
  message: string,
  commandPre: string,
  logs: () => Promise<ShortLog[]>,
): Promise<void> {
  const statusShortLog = await logs()
  if (isEmpty(statusShortLog)) {
    printErr("Nothing To Processing.")
    return
  }
  await checkbox({
    message,
    choices: shortLogFileChoices(statusShortLog),
  }).then(async (answer) => {
    if (isEmpty(answer)) {
      return
    }
    await exec(`${commandPre} ${answer.join(" ")}`)
  })
}

async function singleFileAction({
  message,
  command,
  logs,
  isPrint = false,
  format,
}: {
  message: string
  command: string
  logs: () => Promise<ShortLog[]>
  isPrint?: boolean
  format?: (s: string) => string
}): Promise<void> {
  const statusShortLog = await logs()
  if (isEmpty(statusShortLog)) {
    printErr("Nothing To Processing.")
    return
  }
  await selectAction({
    message,
    choices: shortLogFileChoices(statusShortLog),
    action: (str: string) => `${command} ${str}`,
    isPrint,
    format,
  })
}

async function execPrint(command: string, format?: (s: string) => string) {
  const cl = await exec(command)
  if (format) {
    console.log(format(cl))
    return
  }
  printCmdLog(cl)
}

async function selectAction({
  message,
  choices,
  action,
  isPrint = false,
  format,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  beforeExec = (s) => {},
}: {
  message: string
  choices: { name: string; value: string }[]
  action: (str: string) => string
  isPrint?: boolean
  format?: (str: string) => string
  beforeExec?: (str: string) => void
}): Promise<void> {
  if (isEmpty(choices)) {
    printErr("Nothing To Process.")
    return
  }
  await select({
    message,
    choices,
  }).then(async (answer) => {
    if (isEmpty(answer)) {
      return
    }
    beforeExec(answer)
    if (isPrint) {
      await execPrint(action(answer), format)
      return
    }
    await exec(action(answer))
  })
}

function lines(str: string): string[] {
  return str
    .trim()
    .split("\n")
    .map((it) => it.trim())
}

function branchNames(
  logs: string,
  exCurr: boolean,
  nameFilter?: string,
): string[] {
  return lines(logs)
    .filter((str) => (nameFilter ? str.includes(nameFilter) : true))
    .filter((it) => (exCurr ? !it.startsWith("*") : true))
}

async function branchAction({
  action,
  nameFilter,
  listOption,
  branchFilter,
  format,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  beforeExec = (s) => {},
  branchSort = (s) => s,
}: {
  action: (str: string) => string
  nameFilter?: string
  listOption?: string
  branchFilter?: (branchName: string) => boolean
  format?: (str: string) => string
  beforeExec?: (str: string) => void
  branchSort?: (str: string[]) => string[]
}): Promise<void> {
  const calBranchName = (logs: string) =>
    branchNames(logs, true, nameFilter).filter((it) =>
      branchFilter ? branchFilter(it) : true,
    )
  const mapToChoices = (names: string[]) =>
    names.map((it) => ({ name: it, value: it }))
  const choices = await exec(`git branch ${listOption ? listOption : "-l"}`)
    .then(calBranchName)
    .then(branchSort)
    .then(mapToChoices)
  await selectAction({
    message: "Select Branch:",
    choices,
    action,
    format,
    beforeExec,
  })
}

function title(strs: string[]) {
  return strs.map((it) => color.green.bold(it))
}

async function pageTable({
  titleStr,
  data,
  config,
  rowParse,
}: {
  titleStr: string[]
  data: string[][]
  config: (strs: string[][]) => TableUserConfig
  rowParse: (s: string[]) => string[]
}): Promise<void> {
  const tableStr = (tableData: string[][]) => {
    const td = [title(titleStr), ...tableData.map(rowParse)]
    return table(td, config(td))
  }
  await page({ data: tableDataPartation(data).map(tableStr) })
}

function tableDataPartation(
  data: string[][],
  pageSize: number = 5,
): string[][][] {
  return data.reduce(
    (result, item, index) => {
      const chunkIndex = Math.floor(index / pageSize)
      if (!result[chunkIndex]) {
        result[chunkIndex] = []
      }
      result[chunkIndex].push(item)
      return result
    },
    [] as string[][][],
  )
}

type ColorApply = (str: string) => string
function colorApply(c: ChalkInstance): ColorApply {
  return (l: string) => c(l)
}

function lineSurgery(
  str: string,
  key: string,
  keyColor?: ChalkInstance,
): (f: (s: string, i?: number) => string) => string {
  return (f: (s: string, i?: number) => string) =>
    str
      .split(key)
      .map(f)
      .join(keyColor ? keyColor(key) : key)
}

function lineParse({
  line,
  parse,
  parseAfter = (str: string) => str,
}: {
  line: string
  parse: Record<string, (str: string) => string>
  parseAfter?: (str: string) => string
}): string {
  const key = Object.keys(parse).find((k) => line.startsWith(k))
  if (key) {
    return parse[key](line)
  }
  return parseAfter ? parseAfter(line) : line
}

type ParseStr = (str: string) => string
function diffLineFormat(): ParseStr {
  const thirdLayer = (s: string) => {
    const sp = (str: string) => {
      if (str.startsWith("-")) {
        return color.maroon(str)
      }
      if (str.startsWith("+")) {
        return color.teal(str)
      }
      return color.mauve(str)
    }
    return lineSurgery(s, ",")(sp)
  }

  const secondLayer = (s: string, i?: number) =>
    i !== 1 ? s : lineSurgery(s, " ")(thirdLayer)

  const parse: Record<string, ParseStr> = {
    "---": colorApply(color.blue),
    "-": colorApply(color.red),
    "+++": colorApply(color.yellow),
    "+": colorApply(color.green),
    "@@": (l) => lineSurgery(l, "@@", color.sky)(secondLayer),
  }
  return (s: string) =>
    lineParse({
      line: s,
      parse,
    })
}

function diffFormat(str: string): string {
  return lineSurgery(str, "\n")(diffLineFormat())
}

function tagFormat(s: string) {
  const parse = (line: string) => {
    const keyShow = (k: string, c: ChalkInstance) => (str: string) =>
      lineSurgery(str, k, color.teal)(colorApply(c))
    const parse: Record<string, ParseStr> = {
      tag: (str) => keyShow("tag", color.yellow)(str),
      "Tagger:": (str) => keyShow("Tagger:", color.green)(str),
      "Date:": (str) => keyShow("Date:", color.mauve)(str),
      "Author:": (str) => keyShow("Author:", color.flamingo)(str),
      "Merge:": (str) => keyShow("Merge:", color.pink)(str),
      commit: (str) => keyShow("commit", color.maroon)(str),
    }
    return lineParse({
      line,
      parse,
      parseAfter: diffLineFormat(),
    })
  }
  return lineSurgery(s, "\n")(parse)
}

async function stashInfo(): Promise<string[][]> {
  const command = `git stash list --pretty=format:'%gd│%gs│%an│%cr'`
  const logs = await exec(command)
  if (isEmpty(logs)) {
    return []
  }
  return lines(logs).map((it) => it.split("│"))
}

async function stashAction({
  action,
  isPrint = false,
}: {
  action: (str: string) => string
  isPrint: boolean
}): Promise<void> {
  const stashInfos = await stashInfo()
  if (isEmpty(stashInfos)) {
    printErr("Stash Is Empty.")
    return
  }
  const choices = stashInfos.map((it) => ({ name: it[1], value: it[0] }))
  await selectAction({
    message: "Select Stassh:",
    choices,
    action,
    isPrint,
  })
}

async function branchHisDataPath() {
  const dir = (await exec("pwd")).trim()
  return `${configPath()}${path.sep}branch_his_${dir
    .replaceAll(path.sep, "_")
    .replaceAll(":", "")}.sqlite`
}

export {
  selectAction,
  statusShortLog,
  changedFile,
  stagedFile,
  batchFileAction,
  singleFileAction,
  branchAction,
  branchNames,
  stashAction,
  stashInfo,
  pageTable,
  execPrint,
  diffFormat,
  tagFormat,
  lines,
  title,
  branchHisDataPath,
}
