import type { ChalkInstance } from "chalk"
import { color } from "./color-utils"

const { green, yellow, blue, teal, sky, mauve, red } = color

type CommandType = "git-pull" | "git-switch"

type CommandLogFormat = {
  match: (lines: string[]) => boolean
  print: (lines: string[]) => void
}

const curlyBraces = /\{([^{}]*)\}/g
const singleQuotes = /'([^']+)'/g
const doubleQuotes = /"([^"]+)"/g

function rpl(str: string, r: RegExp, color: ChalkInstance): string | undefined {
  const m = str.match(r)?.[0]
  if (m) {
    return str.replace(m, color.bold(m))
  }
  return void 0
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
    if (!notFileList && !it.includes("files changed,")) {
      tk(0)
      return arr
    }
    if (it.includes("files changed,")) {
      notFileList = true
      tk(1)
      return arr
    }
    tk(2)
    return arr
  }, [] as string[][])
}

function _fastForwardBodyFileFormat(fileList: string[]): string[] {
  return fileList.map((it) => {
    const [file, change] = it.split("|")
    const spIdx = change.lastIndexOf(" ")
    return `${mauve(file)}|${blue(change.substring(0, spIdx))} ${change
      .substring(spIdx + 1)
      .replaceAll("+", green("+"))
      .replaceAll("-", red("-"))}`
  })
}

function _fastForwardBodyFileSummaryFormat(summaryList: string[]): string[] {
  const summaryStr = summaryList[0]
    .split(", ")
    .map((it) => {
      const l = it.trim()
      const sp = l.indexOf(" ")
      const draw = (str: string) => {
        if (str.includes("insertions")) {
          return green(str)
        }
        if (str.includes("deletions")) {
          return red(str)
        }
        return yellow(str)
      }
      return `${blue(l.substring(0, sp))}${draw(l.substring(sp))}`
    })
    .join(", ")
  return [` ${summaryStr}`]
}

function _fastForwardBodyFileDetailFormat(deatilList: string[]): string[] {
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
  return deatilList.reduce((arr, it) => {
    const renamePath = () => {
      // rename src/main/resources/icons/{grayStarOff.svg => starOffGray.svg}
      const path = it.substring(8)
      const mts = path.match(curlyBraces)?.[0]
      if (!mts) {
        return blue(path)
      }
      const [oldName, newName] = mts.split(" => ")
      const ftPath = path
        .split(mts)
        .map((it) => blue(it))
        .join(`${red(oldName)} => ${green(newName)}`)
      return ` ${blue("rename")} ${ftPath}`
    }
    if (it.startsWith(" rename")) {
      arr.push(renamePath())
    } else {
      // create mode 100644 clinflash-epro/epro/src/main/java/com/jxepro/clinflash/common/ThreadPoolMonitor.java
      const parts = it.split(" ")
      const [ept, type, mode, filetype, file] = parts
      const cl = typeFormat(type)
      arr.push([ept, cl.bold(type), mode, sky(filetype), cl(file)].join(" "))
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
  const line1 = rpl(lines[0], singleQuotes, mauve) ?? lines[0]
  const line2 = rpl(lines[1], doubleQuotes, green) ?? lines[1]
  console.log(`${line1}\n${line2}`)
}

function isUpToDate(lines: string[]): boolean {
  return lines[0].startsWith(`Your branch is up to date with`)
}

function printUpToDate(lines: string[]): void {
  console.log(rpl(lines[0], singleQuotes, mauve) ?? lines[0])
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
