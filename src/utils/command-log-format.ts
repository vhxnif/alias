import type { ChalkInstance } from "chalk"
import { color } from "./color-utils"
import {
  cleanFilePath,
  isSummmaryLine,
  reg,
  renderFileChange,
  renderSummaryLine,
} from "./common-utils"
import { terminal } from "./platform-utils"

const { green, yellow, blue, teal, sky, mauve, red } = color

type CommandType = "git-pull" | "git-switch" 

type CommandLogFormat = {
  match: (lines: string[]) => boolean
  print: (lines: string[]) => void
}

function rpl(str: string, r: RegExp, color: ChalkInstance): string {
  return str.replaceAll(r, (m) => color.bold(m))
}

/**
 *
 * Updating 3cdf34546..889f31388
 * Fast-forward
 *  .../clinflash/ae/dto/AeEventSearchParam.java       |   2 +
 *  .../clinflash/ae/repository/AeEventMapper.xml      |   4 +-
 *  .../clinflash/ae/service/impl/AeEmailStrategy.java |  16 +-
 *  .../report/util/SubjectDataExcelRunnable.java      |   7 +-
 *  .../enums/TranslateTypeEnum.java                   |   2 +-
 *  .../epro/src/main/resources/script/basetable.sql   |  14 +
 *  .../script/db.1.11/ddl/1.11_20250515_ae2_wj.sql    |   3 +
 *  .../ddl/1.11_20250515_report_asyn_wj.sql.sql       |   7 +-
 *  .../dml/1.11_localized_datastring_add_jingyang.sql |  14 +
 *  32 files changed, 772 insertions(+), 157 deletions(-)
 *  create mode 100644 clinflash-epro/epro/src/main/java/com/jxepro/clinflash/common/ThreadPoolMonitor.java
 *  create mode 100644 clinflash-epro/epro/src/main/java/com/jxepro/clinflash/replay/service/impl/ReplayQueueManager.java
 *  delete mode 100644 clinflash-epro/epro/src/main/java/com/jxepro/clinflash/replay/support/ReplayLater.java
 *  create mode 100644 clinflash-epro/epro/src/main/resources/script/db.1.11/ddl/1.11_20250515_ae2_wj.sql
 *
 */
function isUpdateFastForward(strs: string[]): boolean {
  return strs[0].startsWith("Updating") && strs[1].startsWith("Fast-forward")
}

function printUpdateFastForwardLog(strs: string[]): void {
  const [fileList, summaryList, deatilList] = _fastForwardBodySplit(strs)
  const str = (
    [
      ..._fastForwardTitle(strs),
      ..._fastForwardBodyFileFormat(fileList),
      ..._fastForwardBodyFileSummaryFormat(summaryList),
      ..._fastForwardBodyFileDetailFormat(deatilList),
    ] as string[]
  ).join("\n")
  return console.log(str)
}

/**
 * Updating 3cdf34546..889f31388
 * Fast-forward
 * @param strs
 */
function _fastForwardTitle(strs: string[]): string[] {
  const [update, hashMove] = strs[0].split(" ")
  const [oldHash, newHash] = hashMove.split("..")
  return [
    `${blue.bold(update)} ${teal(oldHash)}..${sky(newHash)}`,
    yellow(strs[1]),
  ]
}

function _fastForwardBodySplit(strs: string[]) {
  let notFileList = false
  return strs.reduce((arr, it, idx) => {
    if (idx < 2) {
      return arr
    }
    const tk = (idx: number) => {
      const item: string[] = arr[idx]
      if (!item) {
        arr.push([it])
        return
      }
      item.push(it)
    }
    const summaryLine = isSummmaryLine(it)
    if (!notFileList && !summaryLine) {
      tk(0)
      return arr
    }
    if (summaryLine) {
      notFileList = true
      tk(1)
      return arr
    }
    tk(2)
    return arr
  }, [] as string[][])
}

function _fastForwardBodyFileFormat(fileList: string[] | undefined): string[] {
  if (!fileList) {
    return []
  }
  return fileList.map((it) => {
    const [file, change] = it.split("|")
    return `${cleanFilePath(file, terminal.column)}|${renderFileChange(change)}`
  })
}

function _fastForwardBodyFileSummaryFormat(
  summaryList: string[] | undefined
): string[] {
  if (!summaryList) {
    return []
  }
  return [` ${renderSummaryLine(summaryList[0])}`]
}

function _fastForwardBodyFileDetailFormat(
  deatilList: string[] | undefined
): string[] {
  const typeFormat = (str: string) => {
    switch (str) {
      case "create":
        return green
      case "delete":
        return red
      default:
        return sky
    }
  }
  if (!deatilList) {
    return []
  }
  return deatilList.reduce((arr, it) => {
    const cleanPath = (path: string) =>
      cleanFilePath(path, terminal.column, false).trim()
    const renamePath = () => {
      // rename src/main/resources/icons/{grayStarOff.svg => starOffGray.svg}
      const path = it.substring(8)
      const mts = path.match(reg.curlyBraces)?.[0]
      if (!mts) {
        return blue(path)
      }
      const [oldName, newName] = mts.split(" => ")
      const ftPath = path
        .split(mts)
        .map((it) => blue(it))
        .join(`${red(oldName)} => ${green(newName)}`)
      return ` ${blue("rename")} ${cleanPath(ftPath)}`
    }
    if (it.startsWith(" rename")) {
      arr.push(renamePath())
    } else {
      // create mode 100644 clinflash-epro/epro/src/main/java/com/jxepro/clinflash/common/ThreadPoolMonitor.java
      const parts = it.split(" ")
      const [ept, type, mode, filetype, file] = parts
      const cl = typeFormat(type)
      arr.push(
        [ept, cl.bold(type), mode, sky(filetype), cl(cleanPath(file))].join(" ")
      )
    }
    return arr
  }, [] as string[])
}

function isAlreadyUpToDate(lines: string[]): boolean {
  return "Already up to date." === lines[0]
}

function printAlreadyUpToDateLog(lines: string[]): void {
  console.log(green(lines[0]))
}

/*
<git-switch>

Your branch is behind 'origin/docker' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)
*/
function isFastForwardedPrompt(lines: string[]): boolean {
  return (
    lines[0].startsWith(`Your branch is behind`) &&
    lines[0].endsWith(`can be fast-forwarded.`)
  )
}

function printFastForwardedPrompt(lines: string[]): void {
  const { singleQuotes, doubleQuotes } = reg
  const line1 = rpl(lines[0], singleQuotes, mauve)
  const line2 = rpl(lines[1], doubleQuotes, green)
  console.log(`${line1}\n${line2}`)
}

function isUpToDate(lines: string[]): boolean {
  return lines[0].startsWith(`Your branch is up to date with`)
}

function printUpToDate(lines: string[]): void {
  console.log(rpl(lines[0], reg.singleQuotes, mauve))
}

function isSwitchCreateBranch(lines: string[]): boolean {
  return lines[0].startsWith("Switched to a new branch")
}

function printSwitchCreateBranch(lines: string[]): void {
  const line = rpl(lines[0], reg.singleQuotes, mauve)
  console.log(green(line))
}

function isSwitchTrackRemote(lines: string[]): boolean {
  return lines[0].startsWith("branch ") && lines[0].includes(" set up to track")
}

function printSwitchTrackRemote(lines: string[]): void {
  const line = rpl(lines[0], reg.singleQuotes, mauve)
  console.log(green(line))
}

const format: Record<CommandType, CommandLogFormat[]> = {
  "git-pull": [
    {
      match: isAlreadyUpToDate,
      print: printAlreadyUpToDateLog,
    },
    {
      match: isUpdateFastForward,
      print: printUpdateFastForwardLog,
    },
  ],
  "git-switch": [
    {
      match: isSwitchCreateBranch,
      print: printSwitchCreateBranch,
    },
    {
      match: isSwitchTrackRemote,
      print: printSwitchTrackRemote,
    },
    {
      match: isFastForwardedPrompt,
      print: printFastForwardedPrompt,
    },
    {
      match: isUpToDate,
      print: printUpToDate,
    },
  ],
}

function logcmd(log: string, type: CommandType): void {
  const lines = log.split("\n")
  let foramtMatched = false
  format[type].forEach((it) => {
    if (it.match(lines)) {
      it.print(lines)
      foramtMatched = true
      return
    }
  })
  if (!foramtMatched) {
    console.log(color.yellow(log))
  }
}

export { format, logcmd }
