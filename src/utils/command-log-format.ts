import { color } from "./color-utils"

const { green, yellow, blue, teal, sky, mauve, red } = color

type CommandType = "git-pull"

type CommandLogFormat = {
  match: (lines: string[]) => boolean
  print: (lines: string[]) => void
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
  const arr: string[] = []
  const [update, hashMove] = strs[0].split(" ")
  const [oldHash, newHash] = hashMove.split("..")
  arr.push(`${blue.bold(update)} ${teal(oldHash)}..${sky(newHash)}`)
  arr.push(yellow(strs[1]))
  let notFileList = false
  const [fileList, summaryList] = strs.reduce((arr, it, idx) => {
    if (idx < 2) {
      return arr
    }
    if (it.startsWith(" ...") && !notFileList) {
      const fl: string[] | undefined = arr[0]
      if (!fl) {
        arr.push([it])
        return arr
      }
      fl.push(it)
      return arr
    }
    notFileList = true
    const summary = arr[1]
    if (!summary) {
      arr.push([it])
      return arr
    }
    summary.push(it)
    return arr
  }, [] as string[][])
  const fls = fileList.map((it) => {
    const [file, change] = it.split("|")
    const spIdx = change.lastIndexOf(" ")
    return `${mauve(file)}|${blue(change.substring(0, spIdx))} ${change
      .substring(spIdx + 1)
      .replaceAll("+", green("+"))
      .replaceAll("-", red("-"))}`
  })
  arr.push(...fls)
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
  arr.push(` ${summaryStr}`)

  const fileDetails = summaryList.reduce((arr, it, idx) => {
    if (idx < 1) {
      return arr
    }
    // create mode 100644 clinflash-epro/epro/src/main/java/com/jxepro/clinflash/common/ThreadPoolMonitor.java
    const parts = it.split(" ")
    const [ept, type, mode, filetype, file] = parts
    const typeFormat = (str: string) => {
      switch (str) {
        case "create":
          return green(str)
        case "delete":
          return red(str)
        default:
          return blue(str)
      }
    }
    arr.push(
      [ept, typeFormat(type), mode, sky(filetype), mauve(file)].join(" ")
    )
    return arr
  }, [] as string[])
  arr.push(...fileDetails)
  console.log(arr.join("\n"))
}

const format: Record<CommandType, CommandLogFormat[]> = {
  "git-pull": [
    {
      match: isUpdateFastForward,
      print: printUpdateFastForwardLog,
    },
  ],
}

export { format }
