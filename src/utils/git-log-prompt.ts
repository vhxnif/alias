import {
  createPrompt,
  useEffect,
  useKeypress,
  useMemo,
  useRef,
  useState,
} from "@inquirer/core"
import type { ChalkInstance } from "chalk"
import clipboard from "clipboardy"
import { table, type TableUserConfig } from "table"
import { color, colorHex, display, tableTitle } from "./color-utils"
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

export type GitLogReturnType = "AI_SUMMARY" | "COMMIT_DIFF"

export type GitLogReturn = {
  config: GitLogConfig
  type: GitLogReturnType
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
  yanked?: boolean,
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
    tableConfig(logs),
  )
}

function cardTableConfig() {
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

// --- Refactored Detail Formatting Start ---

function _formatDetailHeader(headerLines: string[]): string {
  const { yellow, blue, sky, green, mauve, teal } = color
  const formattedLines: string[] = []
  headerLines.forEach((line) => {
    if (line.startsWith("commit")) {
      const hash = yellow(line.split(" ")[1])
      formattedLines.push(`${blue.bold("Commit:")} ${hash}`)
    } else if (line.startsWith("Merge:")) {
      const [_, oldHash, newHash] = line.split(" ")
      formattedLines.push(
        `${blue.bold("Merge:")} ${sky(oldHash)} ${green(newHash)}`,
      )
    } else if (line.startsWith("Author:")) {
      const [_, author, email] = line.split(" ")
      formattedLines.push(
        `${blue.bold("Author:")} ${mauve(author)} <${green(
          email.substring(1, email.length - 1),
        )}>`,
      )
    } else if (line.startsWith("Date:")) {
      const [_, date] = line.split("Date:")
      formattedLines.push(`${blue.bold("Date:")} ${teal(date)}`)
    }
  })
  return formattedLines.join("\n")
}

function _formatDetailMessage(messageLines: string[]): string {
  const singleQuotes = /'([^']+)'/g
  const doubleQuotes = /"([^"]+)"/g
  return messageLines
    .map((line) => {
      if (line.startsWith("    ")) {
        return line
          .replaceAll(singleQuotes, (m) => display.important.bold(m))
          .replaceAll(doubleQuotes, (m) => display.important.bold(m))
      }
      return line // Keep blank lines
    })
    .join("\n")
}

function _formatDetailFileStats(statLines: string[]): string {
  const formattedLines: string[] = []
  statLines.forEach((line) => {
    if (line.startsWith(" ") && line.includes("|")) {
      const [file, change] = line.split("|")
      formattedLines.push(
        `${cleanFilePath(file, tableColumnWidth)}|${renderFileChange(change)}`,
      )
    } else if (isSummmaryLine(line)) {
      formattedLines.push(renderSummaryLine(line))
    }
  })
  return formattedLines.join("\n")
}

function formatDetail(detailStr: string): string {
  const lines = detailStr.split("\n")
  if (lines.length <= 4) return "" // Guard for empty/short input

  const headerEndIndex = lines.findIndex((line) => line.trim() === "")
  const statsStartIndex = lines.findIndex(
    (line) =>
      (line.startsWith(" ") && line.includes("|")) || isSummmaryLine(line),
  )

  const headerLines = lines.slice(0, headerEndIndex)

  const messageLines = lines.slice(
    headerEndIndex,
    statsStartIndex === -1 ? undefined : statsStartIndex,
  )

  const statLines = statsStartIndex === -1 ? [] : lines.slice(statsStartIndex)

  const formattedHeader = _formatDetailHeader(headerLines)
  const formattedMessage = _formatDetailMessage(messageLines)
  const formattedFileStats = _formatDetailFileStats(statLines)

  return [formattedHeader, formattedMessage, formattedFileStats]
    .filter(Boolean)
    .join("\n")
}

// --- Refactored Detail Formatting End ---

type LogDetail = {
  showDetail: string
  branchDetail: string
}
function rowCard(
  detailInfo: LogDetail | undefined,
  branchShow: boolean = false,
): string {
  if (!detailInfo) {
    return table([[""]], cardTableConfig())
  }
  const { showDetail, branchDetail } = detailInfo
  let display = formatDetail(showDetail) // <-- Using new refactored function
  if (branchShow) {
    const bfFormat = branchInfoFormat(branchDetail)
    display = `${display}\n${color.mauve(
      "-".repeat(tableColumnWidth),
    )}\n${bfFormat}`
  }
  return table([[display]], cardTableConfig())
}

function branchInfoFormat(branchInfo: string): string {
  const { green, red, yellow } = color
  const ft = (str: string) => {
    if (str.startsWith("*")) {
      return green(str)
    }
    if (str.startsWith("  remotes/")) {
      return red(str)
    }
    return yellow(str)
  }
  return branchInfo.split("\n").map(ft).join("\n")
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

type KeyHelp = { desc: string; key: string }

function _formatKeyLine(desc: string, key: string, width: number): string {
  const keyStr = color.teal(`<${key}>`)
  const descStr = color.blue(desc)
  const paddingWidth =
    width - Bun.stringWidth(descStr) - Bun.stringWidth(keyStr)
  const padding = ".".repeat(paddingWidth > 0 ? paddingWidth : 0)
  return `${descStr}${color.surface2(padding)}${keyStr}`
}

function _createPlaceholder(width: number): string {
  return color.surface2(
    "· "
      .repeat(width / 2)
      .trim()
      .padEnd(width),
  )
}

function _renderKeyHelp(normalKeys: KeyHelp[], rowKeys: KeyHelp[]): string {
  const calcWidth = (keys: KeyHelp[]) =>
    maxWidth(keys.map((k) => `${k.desc} <${k.key}>`)) + 4

  const normalColWidth = calcWidth(normalKeys)
  const rowColWidth = calcWidth(rowKeys)
  const maxRows = Math.max(normalKeys.length, rowKeys.length)

  const helpLines: string[] = []
  const normalTitle = "NORMAL MODE".padEnd(normalColWidth)
  const rowTitle = "ROW MODE".padEnd(rowColWidth)

  helpLines.push(
    ` ${display.highlight.bold(normalTitle)}   ${display.highlight.bold(
      rowTitle,
    )}`,
  )
  helpLines.push(
    ` ${color.mauve("-".repeat(normalColWidth))}   ${color.mauve(
      "-".repeat(rowColWidth),
    )}`,
  )

  for (let i = 0; i < maxRows; i++) {
    const normalKey = normalKeys[i]
    const normalLine = normalKey
      ? _formatKeyLine(normalKey.desc, normalKey.key, normalColWidth)
      : _createPlaceholder(normalColWidth)

    const rowKey = rowKeys[i]
    const rowLine = rowKey
      ? _formatKeyLine(rowKey.desc, rowKey.key, rowColWidth)
      : _createPlaceholder(rowColWidth)

    helpLines.push(` ${normalLine}   ${rowLine}`)
  }

  return `\n${helpLines.join("\n")}`
}

function normalKeyMap(): KeyHelp[] {
  return [
    { desc: "Switch Mode", key: "space" },
    { desc: "Up", key: "k" },
    { desc: "Down", key: "j" },
    { desc: "Quit", key: "q" },
  ]
}

function rowKeyMap(): KeyHelp[] {
  return [
    { desc: "Yank Hash", key: "y" },
    { desc: "Show Branches", key: "b" },
    { desc: "AI Summary", key: "s" },
    { desc: "Commit Diff", key: "d" },
    { desc: "View Details", key: "enter" },
  ]
}

function key(desc: string, value: string): string {
  return `${desc} ${color.teal(`<${value}>`)}`
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

export default createPrompt<GitLogReturn, GitLogConfig>((config, done) => {
  const { data, pageIndex, rowIndex, pageSize } = config
  const dataPages = pages(data, pageSize ?? 5)
  const [mode, setMode] = useState<Mode>(rowIndex !== void 0 ? "ROW" : "PAG")
  const [rowIdx, setRowIdx] = useState<number>(rowIndex ?? -1)
  const [pageIdx, setPageIdx] = useState<number>(pageIndex ?? 0)
  const [show, setShow] = useState<string>(
    pageTable({ logs: dataPages[pageIdx], selectedIdx: rowIdx }),
  )
  const [summary, setSummary] = useState(false)
  const [diffShow, setDiffShow] = useState(false)
  const [keyBar, setKeyBar] = useState<boolean>(false)
  const refreshTableShow = (pIdx: number, rIdx: number, yanked?: boolean) => {
    setShow(
      pageTable({
        logs: dataPages[pIdx],
        selectedIdx: rIdx,
        yanked,
      }),
    )
  }

  const logDetailInfo = useMemo<Promise<LogDetail | undefined>>(async () => {
    const commitHash: string | undefined =
      dataPages[pageIdx]?.[rowIdx]?.commitHash
    if (commitHash) {
      return {
        showDetail: await exec(`git show --stat ${commitHash}`),
        branchDetail: await exec(`git branch -a --contains ${commitHash}`),
      }
    }
    return void 0
  }, [pageIdx, rowIdx])

  const cardShow = useRef(false)
  const branchShow = useRef(false)

  useEffect(() => {
    cardShow.current = false
    branchShow.current = false
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
    if (!cardShow.current) {
      setShow(rowCard(await logDetailInfo))
    } else {
      refreshTableShow(pIdx, rIdx)
    }
    cardShow.current = !cardShow.current
  }

  const logDetailWithBranch = async () => {
    if (isPage()) {
      return
    }
    if (!cardShow.current) {
      return
    }
    setShow(rowCard(await logDetailInfo, !branchShow.current))
    branchShow.current = !branchShow.current
  }

  const logSummaryShow = (pIdx: number, rIdx: number) => {
    if (isPage()) {
      return
    }
    setSummary(true)
    const { blue, yellow, mauve } = color
    const { author, commitHash, humanDate } = dataPages[pIdx][rIdx]
    setShow(`${blue.bold(author)} (${mauve(humanDate)}) ${yellow(commitHash)}`)
    console.clear()
    done({
      type: "AI_SUMMARY",
      config: {
        ...config,
        pageIndex: pIdx,
        rowIndex: rIdx,
        pageSize: pageSize ?? 5,
      } as GitLogConfig,
    })
  }

  const commitDiffShow = (pIdx: number, rIdx: number) => {
    if (isPage()) {
      return
    }
    setDiffShow(true)
    const { blue, yellow, mauve } = color
    const { author, commitHash, humanDate } = dataPages[pIdx][rIdx]
    setShow(`${blue.bold(author)} (${mauve(humanDate)}) ${yellow(commitHash)}`)
    console.clear()
    done({
      type: "COMMIT_DIFF",
      config: {
        ...config,
        pageIndex: pIdx,
        rowIndex: rIdx,
        pageSize: pageSize ?? 5,
      } as GitLogConfig,
    })
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
    rl.clearLine(0)
    switch (key.name) {
      case "space":
        changeMode(mode)
        break
      case "h":
        setKeyBar(!keyBar)
        break
      case "j":
        next(pageIdx, rowIdx)
        break
      case "k":
        prev(pageIdx, rowIdx)
        break
      case "return":
        await logDetail(pageIdx, rowIdx)
        break
      case "b":
        await logDetailWithBranch()
        break
      case "y":
        yankHash(pageIdx, rowIdx)
        break
      case "s":
        logSummaryShow(pageIdx, rowIdx)
        break
      case "d":
        commitDiffShow(pageIdx, rowIdx)
        break
      case "q":
        exit()
        break
    }
  })
  const status = () => {
    const s = statusPrompt({
      mode,
      pageIdx,
      rowIdx,
      data: dataPages,
    })
    if (keyBar) {
      return `${s}${_renderKeyHelp(normalKeyMap(), rowKeyMap())}`
    }
    return s
  }
  if (summary || diffShow) {
    return show
  }
  return `${show}${status()}`
})
