import { createPrompt, useKeypress, useState } from "@inquirer/core"
import type { ChalkInstance } from "chalk"
import clipboard from "clipboardy"
import { table, type TableUserConfig } from "table"
import { color, tableTitle } from "./color-utils"
import { isEmpty } from "./common-utils"
import { terminal } from "./platform-utils"
import { tableDefaultConfig } from "./table-utils"

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

export type GitLogKey = keyof GitLog

type Mode = "PAGE" | "ROW"

type GitLogConfig = {
  data: GitLog[]
  pageSize?: number
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
    const { green, yellow, blue, pink, mauve, surface2 } = color
    const refStr = ref.map(refParse).join("\n")
    const selectedMark = () => {
      if (selectedIdx === idx) {
        return `${
          yanked ? surface2.bgGreen(hash) : `[${green(hash)}]`
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

function cardTableCofnig(title: string) {
  const columnLimit = (terminal.column > 80 ? 80 : terminal.column) - 12
  return {
    ...tableDefaultConfig,
    header: {
      content: title,
      alignment: "left",
    },
    columns: [
      {
        alignment: "left",
        width: columnLimit,
      },
    ],
  } as TableUserConfig
}

function rowCard(log: GitLog): string {
  const { author, time, date, message, body, humanDate, commitHash } = log
  const { green, blue, pink, mauve, teal } = color
  const datetime = `${date} ${time}`
  const authorStr = blue.bold(author)
  const humanDatetimeStr = green.bold(humanDate)
  const datetiemStr = mauve.bold(datetime)
  const title = `${authorStr},${humanDatetimeStr} (${datetiemStr})`
  return table(
    [[`${pink(message)}\n\n${teal(body)}`], [green(commitHash)]],
    cardTableCofnig(title)
  )
}

function pages({ data, pageSize = 5 }: GitLogConfig): GitLog[][] {
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
  return `${groupKeyDesc("NORMAL")}: ${keys}`
}

function rowKeyPrompt(): string {
  const keys = groupKey([
    ["Yank", "y"],
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
    PAGE: color.surface2.bold.bgMagenta,
    ROW: color.surface2.bold.bgYellow,
  }
  const modeStatus = `${modeColor[mode](` ${mode} `)}`
  const pageStatus = key("Page", `${pageIdx + 1}/${data.length}`)
  const rowStatus = key("Row", `${rowIdx + 1}/${data[pageIdx].length}`)
  const def = `${modeStatus} ${pageStatus}`
  if (mode === "PAGE") {
    return def
  }
  return `${def} ${rowStatus}`
}

export default createPrompt<number, GitLogConfig>((config, done) => {
  const data = pages(config)
  const [mode, setMode] = useState<Mode>("PAGE")
  const [rowIdx, setRowIdx] = useState<number>(-1)
  const [pageIdx, setPageIdx] = useState<number>(0)
  const [show, setShow] = useState<string>(
    pageTable({ logs: data[pageIdx], selectedIdx: rowIdx })
  )
  const [cardShow, setCardShow] = useState<boolean>(false)
  const refreshTableShow = (pIdx: number, rIdx: number, yanked?: boolean) => {
    setShow(
      pageTable({
        logs: data[pIdx],
        selectedIdx: rIdx,
        yanked,
      })
    )
    setCardShow(false)
  }

  const changeMode = (m: Mode) => {
    setMode(m === "PAGE" ? "ROW" : "PAGE")
    const rIdx = m === "PAGE" ? 0 : -1
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
  const pageNextIdx = (pIdx: number) => pageIdxMove(nextIdx(pIdx, data.length))
  const rowPrevIdx = (rIdx: number) => rowIdxMove(prevIdx(rIdx))
  const rowNextIdx = (pIdx: number, rIdx: number) =>
    rowIdxMove(nextIdx(rIdx, data[pIdx].length))

  const prev = (pIdx: number, rIdx: number) => {
    if (mode === "PAGE") {
      refreshTableShow(pagePrevIdx(pIdx), rIdx)
      return
    }
    refreshTableShow(pIdx, rowPrevIdx(rIdx))
  }

  const next = (pIdx: number, rIdx: number) => {
    if (mode === "PAGE") {
      refreshTableShow(pageNextIdx(pIdx), rIdx)
      return
    }
    refreshTableShow(pIdx, rowNextIdx(pIdx, rIdx))
  }

  const changeCardShow = (pIdx: number, rIdx: number, cardShow: boolean) => {
    if (mode === "PAGE") {
      return
    }
    if (cardShow) {
      refreshTableShow(pIdx, rIdx)
    } else {
      setShow(rowCard(data[pIdx][rIdx]))
    }
    setCardShow(!cardShow)
  }

  const yankHash = (pIdx: number, rIdx: number) => {
    if (mode === "PAGE") {
      return
    }
    const { commitHash } = data[pIdx][rIdx]
    clipboard.writeSync(commitHash)
    refreshTableShow(pIdx, rIdx, true)
  }

  useKeypress((key, rl) => {
    const isKey = (str: string) => key.name === str
    if (isKey("space")) {
      changeMode(mode)
    } else if (isKey("j")) {
      next(pageIdx, rowIdx)
    } else if (isKey("k")) {
      prev(pageIdx, rowIdx)
    } else if (isKey("return")) {
      changeCardShow(pageIdx, rowIdx, cardShow)
    } else if (isKey("y")) {
      yankHash(pageIdx, rowIdx)
    } else if (isKey("q")) {
      done(-1)
    }
    rl.clearLine(0)
  })
  const status = statusPrompt({
    mode,
    pageIdx,
    rowIdx,
    data,
  })
  return `${show}${normalKeyPrompt()}\n${rowKeyPrompt()}\n${status}`
})
