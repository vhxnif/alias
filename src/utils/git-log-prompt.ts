import {
  createPrompt,
  isEnterKey,
  isSpaceKey,
  useEffect,
  useKeypress,
  useMemo,
  useRef,
  useState,
} from "@inquirer/core"
import type { ChalkInstance } from "chalk"
import clipboard from "clipboardy"
import { table, type TableUserConfig } from "table"
import { color, colorHex, tableTitle } from "./color-utils"
import {
  cleanFilePath,
  isEmpty,
  isSummmaryLine,
  renderFileChange,
  renderSummaryLine,
} from "./common-utils"
import { exec, exit, terminal } from "./platform-utils"
import { tableColumnWidth, tableDefaultConfig } from "./table-utils"

export type GitLog = {
  hash: string
  date: string
  author: string
  time: string
  message: string
  ref: string[]
  body: string
  commitHash: string
  humanDate: string
}

type Mode = "PAG" | "ROW"
export type GitLogKey = keyof GitLog

export type GitLogConfig = {
  data: GitLog[]
  pageSize?: number
  pageIndex?: number
  rowIndex?: number
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

function gitLogToTableData(
  logs: GitLog[],
  selectedIdx: number,
  yanked?: boolean
): string[][] {
  return logs.map((l, idx) => {
    const { hash, author, message, time, date, ref } = l
    const { yellow, blue, pink, mauve, surface2 } = color
    const refStr = ref.map(refParse).join("\n")
    const selectedMark = () => {
      if (selectedIdx === idx) {
        return `${
          yanked
            ? surface2.bold.bgHex(colorHex.sky)(hash)
            : surface2.bold.bgHex(colorHex.yellow)(hash)
        }\n${mauve(date)}`
      }
      return `${yellow(hash)}\n${mauve(date)}`
    }

    return [
      selectedMark(),
      `${blue(author)}\n${mauve(time)}`,
      !isEmpty(refStr) ? `${pink(message)}\n${refStr}` : pink(message),
    ]
  })
}

function refParse(name: string): string {
  const branch = "\u21c4"
  const tag = "\u2691"
  const match = (str: string) => name.trim().startsWith(str)
  const iconShow = (icon: string, c: ChalkInstance) =>
    c(`${icon} ${name.trim()}`)
  if (match("origin")) {
    return iconShow(branch, color.sky)
  }
  if (match("HEAD ->")) {
    return iconShow(branch, color.green)
  }
  if (match("tag:")) {
    return iconShow(tag, color.red)
  }
  return iconShow(branch, color.peach)
}

type PageTableArg = {
  logs: GitLog[]
  selectedIdx: number
  yanked?: boolean
}

function pageTable({ logs, selectedIdx, yanked }: PageTableArg): string {
  return table(
    [
      tableTitle(["Hash\nDate", "Author\nTime", "Message\nRef"]),
      ...gitLogToTableData(logs, selectedIdx, yanked),
    ],
    tableConfig(logs)
  )
}

function cardTableCofnig() {
  return {
    ...tableDefaultConfig,
    columns: [
      {
        alignment: "left",
        width: tableColumnWidth,
      },
    ],
  } as TableUserConfig
}

function rowCard(detailStr: string | undefined): string {
  return table([[`${detailInfoFormat(detailStr)}`]], cardTableCofnig())
}

function detailInfoFormat(deatilStr: string | undefined): string {
  if (!deatilStr) {
    return ""
  }
  const lines = deatilStr.split("\n")
  if (lines.length <= 4) {
    return ""
  }
  return lines
    .reduce((arr, it, idx) => {
      if (logTitleInfo(it, idx, arr)) {
        return arr
      }
      if (logMessageAndBodyInfo(it, arr)) {
        return arr
      }
      if (logFileChangedListInfo(it, arr)) {
        return arr
      }
      logSummaryInfo(it, arr)
      return arr
    }, [] as string[][])
    .map((it) => it.join("\n"))
    .join("\n")
}

function logSummaryInfo(line: string, arr: string[][]): boolean {
  const sm = (str: string) => {
    const s = arr[3]
    if (s) {
      s.push(str)
      return
    }
    arr.push([str])
  }
  if (isSummmaryLine(line)) {
    return false
  }
  sm(renderSummaryLine(line))
  return true
}

function logFileChangedListInfo(line: string, arr: string[][]): boolean {
  const fls = (str: string) => {
    const fl = arr[2]
    if (fl) {
      fl.push(str)
      return
    }
    arr.push([str])
  }
  if (line.startsWith(" ") && line.includes("|")) {
    const [file, change] = line.split("|")
    fls(`${cleanFilePath(file, tableColumnWidth)}|${renderFileChange(change)}`)
    return true
  }
  return false
}

function logTitleInfo(line: string, idx: number, arr: string[][]) {
  const { yellow, blue, sky, green, mauve, teal } = color
  if (line.startsWith("commit") && idx === 0) {
    const hash = yellow(line.split(" ")[1])
    arr.push([`${blue.bold("Commit:")} ${hash}`])
    return true
  }
  if (line.startsWith("Merge:")) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, oldHash, newHash] = line.split(" ")
    arr[0].push(`${blue.bold("Merge:")} ${sky(oldHash)} ${green(newHash)}`)
    return true
  }
  if (line.startsWith("Author:")) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, author, email] = line.split(" ")
    arr[0].push(
      `${blue.bold("Author:")} ${mauve(author)} <${green(
        email.substring(1, email.length - 1)
      )}>`
    )
    return true
  }
  if (line.startsWith("Date:")) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, date] = line.split("Date:")
    arr[0].push(`${blue.bold("Date:")} ${teal(date)}`)
    return true
  }
  return false
}

function logMessageAndBodyInfo(line: string, arr: string[][]): boolean {
  const msgPush = (str: string) => {
    const messages = arr[1]
    if (!messages) {
      arr.push([str])
      return
    }
    messages.push(str)
  }
  if (isEmpty(line)) {
    msgPush(line)
    return true
  }
  if (line.startsWith("    ")) {
    const singleQuotes = /'([^']+)'/g
    const doubleQuotes = /"([^"]+)"/g
    const str = line
      .replaceAll(singleQuotes, (m) => color.pink.bold(m))
      .replaceAll(doubleQuotes, (m) => color.pink.bold(m))
    msgPush(str)
    return true
  }
  return false
}

function pages(data: GitLog[], pageSize: number): GitLog[][] {
  return data.reduce((arr, it) => {
    const last = arr[arr.length - 1]
    if (!last || last.length === pageSize) {
      arr.push([it])
    } else {
      last.push(it)
    }
    return arr
  }, [] as GitLog[][])
}

function prevIdx(idx: number): number {
  if (idx === -1) {
    return 0
  }
  const prev = idx - 1
  return prev < 0 ? idx : prev
}

function nextIdx(idx: number, length: number): number {
  if (idx === -1) {
    return 0
  }
  const next = idx + 1
  return next > length - 1 ? idx : next
}

function key(desc: string, value: string): string {
  return `${desc} ${color.teal(`<${value}>`)}`
}

function groupKey(keys: [string, string][]): string {
  return keys.map((it) => key(it[0], it[1])).join(", ")
}

function groupKeyDesc(desc: string): string {
  return color.blue.bold(desc)
}

function normalKeyPrompt(): string {
  const keys = groupKey([
    ["Mode", "space"],
    ["Prev", "k"],
    ["Next", "j"],
    ["Quit", "q"],
  ])
  return `${groupKeyDesc("NOR")}: ${keys}`
}

function rowKeyPrompt(): string {
  const keys = groupKey([
    ["Yank", "y"],
    ["Summary", "s"],
    ["Detail", "enter"],
  ])
  return `${groupKeyDesc("ROW")}: ${keys}`
}

function statusPrompt({
  mode,
  data,
  pageIdx,
  rowIdx,
}: {
  mode: Mode
  data: GitLog[][]
  pageIdx: number
  rowIdx: number
}): string {
  const modeColor: Record<Mode, ChalkInstance> = {
    PAG: color.surface2.bold.bgHex(colorHex.green),
    ROW: color.surface2.bold.bgHex(colorHex.yellow),
  }
  const modeStatus = `${modeColor[mode](` ${mode} `)}`
  const help = `(Press${key("", "h")} to view the key mapping.)`
  if (mode === "PAG") {
    return `${key(modeStatus, `${pageIdx + 1}/${data.length}`)} ${help}`
  }
  return `${key(modeStatus, `${rowIdx + 1}/${data[pageIdx].length}`)} ${help}`
}

export default createPrompt<GitLogConfig, GitLogConfig>((config, done) => {
  const { data, pageIndex, rowIndex, pageSize } = config
  const dataPages = pages(data, pageSize ?? 5)
  const [mode, setMode] = useState<Mode>(rowIndex !== void 0 ? "ROW" : "PAG")
  const [rowIdx, setRowIdx] = useState<number>(rowIndex ?? -1)
  const [pageIdx, setPageIdx] = useState<number>(pageIndex ?? 0)
  const [show, setShow] = useState<string>(
    pageTable({ logs: dataPages[pageIdx], selectedIdx: rowIdx })
  )
  const [summary, setSummary] = useState(false)
  const [keyBar, setKeyBar] = useState<boolean>(false)
  const refreshTableShow = (pIdx: number, rIdx: number, yanked?: boolean) => {
    setShow(
      pageTable({
        logs: dataPages[pIdx],
        selectedIdx: rIdx,
        yanked,
      })
    )
  }

  const logDetailInfo = useMemo(async () => {
    const commitHash: string | undefined =
      dataPages[pageIdx]?.[rowIdx]?.commitHash
    if (commitHash) {
      return await exec(`git show --stat ${commitHash}`)
    }
    return void 0
  }, [pageIdx, rowIdx])

  const cardShow = useRef(true)
  useEffect(() => {
    cardShow.current = true
  }, [pageIdx, rowIdx])

  const changeMode = (m: Mode) => {
    setMode(m === "PAG" ? "ROW" : "PAG")
    const rIdx = m === "PAG" ? 0 : -1
    setRowIdx(rIdx)
    refreshTableShow(pageIdx, rIdx)
  }

  const getNewIdx = (newIdx: number, setState: (n: number) => void) => {
    setState(newIdx)
    return newIdx
  }
  const pageIdxMove = (newIdx: number) => getNewIdx(newIdx, setPageIdx)
  const rowIdxMove = (newIdx: number) => getNewIdx(newIdx, setRowIdx)
  const pagePrevIdx = (pIdx: number) => pageIdxMove(prevIdx(pIdx))
  const pageNextIdx = (pIdx: number) =>
    pageIdxMove(nextIdx(pIdx, dataPages.length))
  const rowPrevIdx = (rIdx: number) => rowIdxMove(prevIdx(rIdx))
  const rowNextIdx = (pIdx: number, rIdx: number) =>
    rowIdxMove(nextIdx(rIdx, dataPages[pIdx].length))

  const isPage = () => mode === "PAG"

  const prev = (pIdx: number, rIdx: number) => {
    if (isPage()) {
      refreshTableShow(pagePrevIdx(pIdx), rIdx)
      return
    }
    refreshTableShow(pIdx, rowPrevIdx(rIdx))
  }

  const next = (pIdx: number, rIdx: number) => {
    if (isPage()) {
      refreshTableShow(pageNextIdx(pIdx), rIdx)
      return
    }
    refreshTableShow(pIdx, rowNextIdx(pIdx, rIdx))
  }

  const logDetail = async (pIdx: number, rIdx: number) => {
    if (isPage()) {
      return
    }
    if (cardShow.current) {
      setShow(rowCard(await logDetailInfo))
    } else {
      refreshTableShow(pIdx, rIdx)
    }
    cardShow.current = !cardShow.current
  }

  const logSummaryShow = (pIdx: number, rIdx: number) => {
    if (isPage()) {
      return
    }
    setSummary(true)
    const { blue, yellow, mauve } = color
    const { author, commitHash, humanDate } = dataPages[pIdx][rIdx]
    setShow(`${blue.bold(author)} (${mauve(humanDate)}) ${yellow(commitHash)}`)

    done({
      ...config,
      pageIndex: pIdx,
      rowIndex: rIdx,
      pageSize: pageSize ?? 5,
    } as GitLogConfig)
  }

  const yankHash = (pIdx: number, rIdx: number) => {
    if (isPage()) {
      return
    }
    const { commitHash } = dataPages[pIdx][rIdx]
    clipboard.writeSync(commitHash)
    refreshTableShow(pIdx, rIdx, true)
  }

  useKeypress(async (key, rl) => {
    const isKey = (str: string) => key.name === str
    if (isSpaceKey(key)) {
      changeMode(mode)
    } else if (isKey("h")) {
      setKeyBar(!keyBar)
    } else if (isKey("j")) {
      next(pageIdx, rowIdx)
    } else if (isKey("k")) {
      prev(pageIdx, rowIdx)
    } else if (isEnterKey(key)) {
      await logDetail(pageIdx, rowIdx)
    } else if (isKey("y")) {
      yankHash(pageIdx, rowIdx)
    } else if (isKey("s")) {
      logSummaryShow(pageIdx, rowIdx)
    } else if (isKey("q")) {
      exit()
    }
    rl.clearLine(0)
  })
  const status = () => {
    const s = statusPrompt({
      mode,
      pageIdx,
      rowIdx,
      data: dataPages,
    })
    if (keyBar) {
      return `${s}\n${normalKeyPrompt()}\n${rowKeyPrompt()}`
    }
    return s
  }
  if (summary) {
    return show
  }
  return `${show}${status()}`
})
