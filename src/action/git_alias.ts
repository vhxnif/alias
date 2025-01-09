import { checkbox, input, select } from "@inquirer/prompts"
import { $, ShellError } from "bun"
import { isEmpty } from "lodash"
import ora from "ora"
import type { IGitAlias } from "../type/git-alias-type"
import type { ILLMClient } from "../type/llm-types"
import { color } from "../utils/color-utils"
import {
  oraText,
  printCmdLog,
  printErr,
  printTable,
  selectRun,
  tableConfig,
  tableDefaultConfig,
  title,
} from "../utils/common-utils"
import { temperature } from "../utils/constant"
import { gitCommitMessage } from "../utils/prompt"

export default class GitAlias implements IGitAlias {
  client: ILLMClient
  constructor(client: ILLMClient) {
    this.client = client
  }

  log = async (limit: number, author?: string) => {
    const ds = [color.yellow, color.blue, color.pink, color.mauve]
    let command = `git log --oneline --format="%h│%an│%s│%ad" --date=format:"%H:%M:%S %Y-%m-%d" -n ${limit}`
    if (author) {
      command = `${command} --author=${author}`
    }
    const logs = await this.exec(command)
    if (isEmpty(logs)) {
      return
    }
    const data = this.lines(logs).map((it) =>
      it.split("│").map((it, idx) => ds[idx]?.(it)),
    )
    printTable(
      [title(["Hash", "Author", "Message", "Date"]), ...data],
      tableConfig([1, 1, 3.5, 2.5]),
    )
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
      tableConfig([1, 1, 3]),
    )
  }
  push = async () => {
    await this.exec("git push")
  }
  pull = async () => await this.execPrint("git pull")

  branchList = async (name?: string, isListAll?: boolean) => {
    await this.exec(`git branch ${isListAll ? "-a" : "-l"}`)
      .then((logs) => this.branchNames(logs, false, name))
      .then((names) =>
        names.map((it) =>
          it.startsWith("*")
            ? [color.yellow(it.replace("*", "").trim())]
            : [color.blue(it.trim())],
        ),
      )
      .then((it) => printTable([title(["Name"]), ...it], tableDefaultConfig))
  }

  branchNew = async (name: string, origin: boolean = false) => {
    if (origin) {
      await this.branchAction(
        (s) => `git switch -t ${s}`,
        name,
        "-a",
        (it) => it.startsWith("remotes") && !it.includes("->"),
      )
      return
    }
    await this.execPrint(`git switch -c ${name}`)
  }

  branchCheckout = async (name?: string) =>
    await this.branchAction((s) => `git switch ${s}`, name)
  branchMerge = async (name?: string) =>
    await this.branchAction((s) => `git merge ${s}`, name)
  branchRebase = async (name?: string) =>
    await this.branchAction((s) => `git rebase ${s}`, name)
  branchDelete = async (name?: string) =>
    await this.branchAction((s) => `git branch -D ${s}`, name)

  stashList = async () => {
    const stashInfos = await this.stashInfo()
    if (isEmpty(stashInfos)) {
      printErr("Stash Is Empty.")
      return
    }
    const ds = [color.yellow, color.blue, color.pink, color.mauve]
    const data = stashInfos.map((row) => row.map((it, idx) => ds[idx]?.(it)))
    printTable(
      [title(["StashNo", "Message", "Autore", "Date"]), ...data],
      tableConfig([1, 3, 1, 1]),
    )
  }

  stashAdd = async (name: string) =>
    await this.exec(`git stash push -m ${name}`).then(() => this.stashList())
  stashPop = async () => await this.exec(`git stash pop`).then(this.status)
  stashShow = async () =>
    await this.stashAction(async (s) => {
      await this.exec(`git stash show -p ${s}`).then(printCmdLog)
    })
  stashApply = async () =>
    await this.stashAction(async (s) => {
      await this.exec(`git stash apply ${s}`).then(printCmdLog)
    })
  stashDrop = async () =>
    await this.stashAction(async (s) => {
      await this.exec(`git stash drop ${s}`).then(printCmdLog)
    })
  add = async () =>
    await this.fileProcess("Select Add Files:", `git add`, this.changedFile)
  restore = async () =>
    await this.fileProcess(
      "Select Restore Files:",
      "git restore --staged",
      this.stagedFile,
    )
  commit = async () => {
    const checkStageFileRun = async () => {
      const stageFile = await this.stagedFile()
      if (isEmpty(stageFile)) {
        printErr("No Changes To Commit.")
        return
      }
      await this.commitWithMessage()
    }
    const addFile = await this.changedFile()
    if (isEmpty(addFile)) {
      checkStageFileRun()
      return
    }
    await checkbox({
      message: "Select Add Files:",
      choices: addFile.map((it) => ({ name: it[2], value: it[2] })),
    }).then(async (answer) => {
      if (isEmpty(answer)) {
        checkStageFileRun()
        return
      }
      await this.exec(`git add ${answer.join(" ")}`).then(
        this.commitWithMessage,
      )
    })
  }

  rollbackFileChanges = async () =>
    await this.fileProcess(
      "Select Rollback Files:",
      "git checkout HEAD --",
      this.changedFile,
      false,
    )

  fileDiff = async () =>
    await this.singleFileProcess("Select Diff File:", "git diff", () =>
      this.statusLogFilter(() => true),
    )

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
        await input({
          message: color.mauve(str),
        }).then((answer) => {
          let msg = str
          if (!isEmpty(answer)) {
            msg = answer
            return
          }
          const cmd = `git commit -m '${msg}'`
          this.execPrint(cmd)
        })
      },
    )
  }

  private statusLogFilter = async (f: (str: string[]) => boolean) =>
    await this.statusShortLogInfo("git status -sunormal").then((it) =>
      it.filter(f),
    )
  private changedFile = async () =>
    await this.statusLogFilter((str: string[]) => str[1] !== " ")
  private stagedFile = async () =>
    await this.statusLogFilter((str: string[]) => ![" ", "?"].includes(str[0]))

  private fileProcess = async (
    message: string,
    commandPre: string,
    logs: () => Promise<string[][]>,
    singleRun: boolean = true,
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
      if (singleRun) {
        await this.exec(`${commandPre} ${answer.join(" ")}`)
        return
      }
      answer.forEach((it) => this.exec(`${commandPre} ${it}`))
    })
  }

  private singleFileProcess = async (
    message: string,
    commandPre: string,
    logs: () => Promise<string[][]>,
    disablePrint: boolean = true,
  ) => {
    const statusShortLog = await logs()
    if (isEmpty(statusShortLog)) {
      printErr("Nothing To Processing.")
      return
    }
    await select({
      message,
      choices: statusShortLog.map((it) => ({ name: it[2], value: it[2] })),
    }).then(async (answer) => {
      if (isEmpty(answer)) {
        return
      }
      const command = `${commandPre} ${answer}`
      if (disablePrint) {
        await this.execPrint(command)
        return
      }
      await this.exec(command)
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

  private stashAction = async (f: (str: string) => Promise<void>) => {
    const stashInfos = await this.stashInfo()
    if (isEmpty(stashInfos)) {
      printErr("Stash Is Empty.")
      return
    }
    const choices = stashInfos.map((it) => ({ name: it[1], value: it[0] }))
    selectRun("Select Stassh:", choices, async (s) => await f(s))
  }
  private stashInfo = async () => {
    const command = `git stash list --pretty=format:'%gd│%gs│%an│%cr'`
    const logs = await this.exec(command)
    if (isEmpty(logs)) {
      return []
    }
    return this.lines(logs).map((it) => it.split("│"))
  }

  private branchAction = async (
    cf: (str: string) => string,
    name?: string,
    opt?: string,
    cuf?: (branchName: string) => boolean,
  ) => {
    const choices = await this.exec(`git branch ${opt ? opt : "-l"}`)
      .then((logs) =>
        this.branchNames(logs, true, name).filter((it) =>
          cuf ? cuf(it) : true,
        ),
      )
      .then((names) => names.map((it) => ({ name: it, value: it })))
    if (isEmpty(choices)) {
      printErr("Branch Not Match.")
      return
    }
    selectRun(
      "Select Branch:",
      choices,
      async (s) => await this.execPrint(cf(s)),
    )
  }

  private execPrint = async (command: string) =>
    printCmdLog(await this.exec(command))

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
}
