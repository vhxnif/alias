import { checkbox, select } from "@inquirer/prompts"
import { $, ShellError } from "bun"
import { isEmpty } from "lodash"
import ora from "ora"
import type { IGitAlias } from "../type/git-alias-type"
import type { ILLMClient } from "../type/llm-types"
import { color } from "../utils/color-utils"
import {
  editor,
  oraText,
  printCmdLog,
  printErr,
  printTable,
  tableConfig,
  tableDefaultConfig,
  title,
} from "../utils/common-utils"
import { temperature } from "../utils/constant"
import { gitCommitMessage, gitLogSummary } from "../utils/prompt"
import type { ChalkInstance } from "chalk"
import { table, type TableUserConfig } from "table"
import { default as page } from "../type/page-prompt"

export default class GitAlias implements IGitAlias {
  client: ILLMClient
  constructor(client: ILLMClient) {
    this.client = client
  }

  log = async (limit?: number, author?: string, from?: string, to?: string) => {
    const logLimit = limit ?? 100
    const logs = await this.exec(
      this.logCommand(logLimit, author, from, to),
    ).then(this.lines)
    if (isEmpty(logs)) {
      return
    }
    await this.pageTable(
      ["Hash\nDate", "Author\nTime", "Message\nRef"],
      logs.map((it) => it.split("│")),
      tableConfig({ cols: [1.5, 1.5, 7] }),
      this.logParse,
    )
  }

  private pageTable = async (
    titleStr: string[],
    data: string[][],
    config: TableUserConfig,
    rowParse: (s: string[]) => string[],
  ) => {
    const tableStr = (tableData: string[][]) =>
      table([title(titleStr), ...tableData.map(rowParse)], config)
    await page({ data: this.tableDataPartation(data).map(tableStr) })
  }

  private tableDataPartation = (data: string[][], pageSize: number = 5) => {
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

  private logParse = (str: string[]) => {
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
      .map(this.refParse)
      .join("\n")
    return [
      `${hash}\n${date}`,
      `${author}\n${time}`,
      ref ? `${message}\n${ref}` : message,
    ]
  }

  private logCommand = (
    limit?: number,
    author?: string,
    from?: string,
    to?: string,
  ) => {
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

  private refParse = (name: string): string => {
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

  status = async () => {
    const statusShortLog = await this.statusShortLogInfo("git status -s")
    if (isEmpty(statusShortLog)) {
      return
    }
    const ds = [color.sky, color.flamingo, color.blue]
    const data = statusShortLog.map((it) =>
      it.map((item, idx) => ds[idx](item)),
    )
    printTable(
      [title(["Stash", "Change", "File"]), ...data],
      tableConfig({ cols: [1, 2, 3] }),
    )
  }
  push = async () => {
    await this.exec("git push").then(async () => await this.log())
  }
  pull = async () => await this.execPrint("git pull")

  branchList = async (name?: string, isListAll?: boolean) => {
    const data = await this.exec(`git branch ${isListAll ? "-a" : "-l"}`)
      .then((logs) => this.branchNames(logs, false, name))
      .then((names) => names.map((it) => [it]))
    const parse = (names: string[]) => {
      return names.map((it) =>
        it.startsWith("*")
          ? color.yellow(it.replace("*", "").trim())
          : color.blue(it.trim()),
      )
    }
    await this.pageTable(["Branch Name"], data, tableDefaultConfig, parse)
  }

  branchNew = async (name: string, origin: boolean = false) => {
    if (origin) {
      await this.branchAction({
        action: (s) => `git switch -t ${s}`,
        nameFilter: name,
        listOption: "-a",
        branchFilter: (it) => it.startsWith("remotes") && !it.includes("->"),
      })
      return
    }
    await this.execPrint(`git switch -c ${name}`)
  }

  branchCheckout = async (name?: string) =>
    await this.branchAction({
      action: (s) => `git switch ${s}`,
      nameFilter: name,
    })
  branchMerge = async (name?: string) =>
    await this.branchAction({
      action: (s) => `git merge ${s}`,
      nameFilter: name,
    })
  branchRebase = async (name?: string) =>
    await this.branchAction({
      action: (s) => `git rebase ${s}`,
      nameFilter: name,
    })
  branchDelete = async (name?: string) =>
    await this.branchAction({
      action: (s) => `git branch -D ${s}`,
      nameFilter: name,
    })

  stashList = async () => {
    const stashInfos = await this.stashInfo()
    if (isEmpty(stashInfos)) {
      printErr("Stash Is Empty.")
      return
    }
    const ds = [color.yellow, color.blue, color.pink, color.mauve]
    const data = stashInfos.map((row) => row.map((it, idx) => ds[idx]?.(it)))
    printTable(
      [title(["StashNo", "Message", "Author", "Date"]), ...data],
      tableConfig({ cols: [1, 3, 1, 1] }),
    )
  }

  stashAdd = async (name: string) =>
    await this.exec(`git stash push -m ${name}`).then(() => this.stashList())
  stashPop = async () => await this.exec(`git stash pop`).then(this.status)
  stashShow = async () =>
    await this.stashAction({
      action: (s: string) => `git stash apply ${s}`,
      isPrint: true,
    })

  stashApply = async () =>
    await this.stashAction({
      action: (s: string) => `git stash apply ${s}`,
      isPrint: true,
    })

  stashDrop = async () =>
    await this.stashAction({
      action: (s: string) => `git stash drop ${s}`,
      isPrint: true,
    })

  add = async () =>
    await this.batchFileProcess(
      "Select Add Files:",
      `git add -- `,
      this.changedFile,
    )
  restore = async () =>
    await this.batchFileProcess(
      "Select Restore Files:",
      "git restore --staged",
      this.stagedFile,
    )

  commit = async () => {
    const stageFile = await this.stagedFile()
    if (isEmpty(stageFile)) {
      printErr("No Changes To Commit.")
      return
    }
    await this.commitWithMessage()
  }

  rollbackFileChanges = async () =>
    await this.singleFileProcess({
      message: "Select Rollback Files:",
      command: "git checkout HEAD --",
      logs: this.changedFile,
    })

  summaryChanges = async (author?: string, from?: string, to?: string) => {
    const spinner = ora(oraText("Extract Git Commit...")).start()
    let command = `git log --oneline --format="%s"`
    if (author) {
      command = `${command} --author="${author}"`
    }
    if (from) {
      command = `${command} --since="${from}"`
    }
    if (to) {
      command = `${command} --before="${to}"`
    }
    const commits = await this.exec(command)
    spinner.succeed(oraText("Summary..."))
    await this.client.stream(
      [this.client.system(gitLogSummary), this.client.user(commits)],
      this.client.defaultModel(),
      temperature.codeOrMath[1],
      async (str: string) => {
        process.stdout.write(str)
      },
    )
  }

  private commitWithMessage = async () => {
    const spinner = ora(oraText("Extract Git Diff...")).start()
    const diff = await this.exec(`git diff --staged`)
    spinner.text = oraText("Analyzing...")
    await this.client.call(
      [this.client.system(gitCommitMessage), this.client.user(diff)],
      this.client.defaultModel(),
      temperature.codeOrMath[1],
      async (str: string) => {
        spinner.succeed(oraText("Summary completed!!!"))
        await editor(
          str,
          async (tmp) => await this.execPrint(`git commit -F "${tmp}"`),
        )
      },
    )
  }

  fileDiff = async () =>
    await this.singleFileProcess({
      message: "Select Changed File:",
      command: "git diff",
      logs: this.statusLogs,
      isPrint: true,
      format: this.diffFormat,
    })

  private lineSurgery = (
    str: string,
    key: string,
    keyColor?: ChalkInstance,
  ) => {
    return (f: (s: string, i?: number) => string) =>
      str
        .split(key)
        .map(f)
        .join(keyColor ? keyColor(key) : key)
  }

  private diffFormat = (str: string) => {
    return this.lineSurgery(str, "\n")(this.diffLineFormat())
  }

  private diffLineFormat = () => {
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
      return this.lineSurgery(s, ",")(sp)
    }

    const secondLayer = (s: string, i?: number) =>
      i !== 1 ? s : this.lineSurgery(s, " ")(thirdLayer)

    const parse: Record<string, (l: string) => string> = {
      "---": this.colorApply(color.blue),
      "-": this.colorApply(color.red),
      "+++": this.colorApply(color.yellow),
      "+": this.colorApply(color.green),
      "@@": (l) => this.lineSurgery(l, "@@", color.sky)(secondLayer),
    }
    return (s: string) =>
      this.lineParse({
        line: s,
        parse,
      })
  }

  private lineParse = ({
    line,
    parse,
    parseAfter = (str: string) => str,
  }: {
    line: string
    parse: Record<string, (str: string) => string>
    parseAfter?: (str: string) => string
  }) => {
    const key = Object.keys(parse).find((k) => line.startsWith(k))
    if (key) {
      return parse[key](line)
    }
    return parseAfter ? parseAfter(line) : line
  }

  private colorApply = (c: ChalkInstance) => (l: string) => c(l)

  private statusLogs = async () =>
    await this.statusShortLogInfo("git status -sunormal")
  private changedFile = async () =>
    await this.statusLogs().then((it) => it.filter((str) => str[1] !== " "))
  private stagedFile = async () =>
    await this.statusLogs().then((it) =>
      it.filter((str) => ![" ", "?"].includes(str[0])),
    )

  private batchFileProcess = async (
    message: string,
    commandPre: string,
    logs: () => Promise<string[][]>,
  ) => {
    const statusShortLog = await logs()
    if (isEmpty(statusShortLog)) {
      printErr("Nothing To Processing.")
      return
    }
    await checkbox({
      message,
      choices: statusShortLog.map((it) => ({ name: it[2], value: it[2] })),
    }).then(async (answer) => {
      if (isEmpty(answer)) {
        return
      }
      this.exec(`${commandPre} ${answer.join(" ")}`)
    })
  }

  private singleFileProcess = async ({
    message,
    command,
    logs,
    isPrint = false,
    format,
  }: {
    message: string
    command: string
    logs: () => Promise<string[][]>
    isPrint?: boolean
    format?: (s: string) => string
  }) => {
    const statusShortLog = await logs()
    if (isEmpty(statusShortLog)) {
      printErr("Nothing To Processing.")
      return
    }
    await this.selectAction({
      message,
      choices: statusShortLog.map((it) => ({ name: it[2], value: it[2] })),
      action: (str: string) => `${command} ${str}`,
      isPrint,
      format,
    })
  }

  private selectAction = async ({
    message,
    choices,
    action,
    isPrint = false,
    format,
  }: {
    message: string
    choices: { name: string; value: string }[]
    action: (str: string) => string
    isPrint?: boolean
    format?: (str: string) => string
  }) => {
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
      if (isPrint) {
        await this.execPrint(action(answer), format)
        return
      }
      await this.exec(action(answer))
    })
  }

  private statusShortLogInfo = async (command: string) => {
    const lines = await this.exec(command)
      .then((it) => it.split("\n"))
      .then((it) => it.filter((l) => !isEmpty(l)))
    if (isEmpty(lines)) {
      return []
    }
    return lines.map((it) => [
      it.substring(0, 1),
      it.substring(1, 2),
      it.substring(3),
    ])
  }

  private stashAction = async ({
    action,
    isPrint = false,
  }: {
    action: (str: string) => string
    isPrint: boolean
  }) => {
    const stashInfos = await this.stashInfo()
    if (isEmpty(stashInfos)) {
      printErr("Stash Is Empty.")
      return
    }
    const choices = stashInfos.map((it) => ({ name: it[1], value: it[0] }))
    await this.selectAction({
      message: "Select Stassh:",
      choices,
      action,
      isPrint,
    })
  }

  private stashInfo = async () => {
    const command = `git stash list --pretty=format:'%gd│%gs│%an│%cr'`
    const logs = await this.exec(command)
    if (isEmpty(logs)) {
      return []
    }
    return this.lines(logs).map((it) => it.split("│"))
  }

  private branchAction = async ({
    action,
    nameFilter,
    listOption,
    branchFilter,
    format,
  }: {
    action: (str: string) => string
    nameFilter?: string
    listOption?: string
    branchFilter?: (branchName: string) => boolean
    format?: (str: string) => string
  }) => {
    const calBranchName = (logs: string) =>
      this.branchNames(logs, true, nameFilter).filter((it) =>
        branchFilter ? branchFilter(it) : true,
      )
    const mapToChoices = (names: string[]) =>
      names.map((it) => ({ name: it, value: it }))
    const choices = await this.exec(
      `git branch ${listOption ? listOption : "-l"}`,
    )
      .then(calBranchName)
      .then(mapToChoices)
    await this.selectAction({
      message: "Select Branch:",
      choices,
      action,
      format,
    })
  }

  private execPrint = async (
    command: string,
    format?: (s: string) => string,
  ) => {
    const cl = await this.exec(command)
    if (format) {
      console.log(format(cl))
      return
    }
    printCmdLog(cl)
  }

  private exec = async (command: string): Promise<string> => {
    try {
      return await $`${{ raw: command }}`.text()
    } catch (err: unknown) {
      printErr((err as ShellError).stderr.toString())
      process.exit()
    }
  }

  private lines = (str: string) =>
    str
      .trim()
      .split("\n")
      .map((it) => it.trim())

  private branchNames = (
    logs: string,
    exCurr: boolean,
    nameFilter?: string,
  ) => {
    return this.lines(logs)
      .filter((str) => (nameFilter ? str.includes(nameFilter) : true))
      .filter((it) => (exCurr ? !it.startsWith("*") : true))
  }

  tagShow = async (tagName?: string) => {
    const tags = (
      await this.exec(`git tag`).then((it) => it.split("\n"))
    ).filter((it) => (tagName ? it.includes(tagName) : true))
    if (isEmpty(tags)) {
      printErr("Tags Is Empty.")
      return
    }
    const choices = tags.map((it) => ({ name: it, value: it }))
    await this.selectAction({
      message: "Select A Tag: ",
      action: (s: string) => `git show ${s}`,
      choices,
      isPrint: true,
      format: this.tagFormat,
    })
  }

  private tagFormat = (s: string) => {
    const lineParse = (line: string) => {
      const keyShow = (k: string, c: ChalkInstance) => (str: string) =>
        this.lineSurgery(str, k, color.teal)(this.colorApply(c))
      const parse: Record<string, (str: string) => string> = {
        tag: (str) => keyShow("tag", color.yellow)(str),
        "Tagger:": (str) => keyShow("Tagger:", color.green)(str),
        "Date:": (str) => keyShow("Date:", color.mauve)(str),
        "Author:": (str) => keyShow("Author:", color.flamingo)(str),
        "Merge:": (str) => keyShow("Merge:", color.pink)(str),
        commit: (str) => keyShow("commit", color.maroon)(str),
      }
      return this.lineParse({
        line,
        parse,
        parseAfter: this.diffLineFormat(),
      })
    }
    return this.lineSurgery(s, "\n")(lineParse)
  }
}
