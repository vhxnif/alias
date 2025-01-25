import { table, type TableUserConfig } from "table"
import { color, style } from "./color-utils"
import type { ChalkInstance } from "chalk"

const terminal: Record<string, number> = {
  column: process.stdout.columns,
  row: process.stdout.rows,
}

const sum = (numbers: number[]) => numbers.reduce((sum, it) => (sum += it), 0)

const tableDefaultConfig: TableUserConfig = {
  border: {
    topBody: `─`,
    topJoin: `┬`,
    topLeft: `╭`,
    topRight: `╮`,

    bottomBody: `─`,
    bottomJoin: `┴`,
    bottomLeft: `╰`,
    bottomRight: `╯`,

    bodyLeft: `│`,
    bodyRight: `│`,
    bodyJoin: `│`,

    joinBody: `─`,
    joinLeft: `├`,
    joinRight: `┤`,
    joinJoin: `┼`,
  },
}

const tableConfig = ({
  cols,
  alignment,
  maxColumn = 80,
}: {
  cols: number[]
  alignment?: "left" | "center" | "justify" | "right"
  maxColumn?: number
}): TableUserConfig => {
  const allPart = sum(cols)
  const curCol = terminal.column - 4 * cols.length
  const colNum = curCol > maxColumn ? maxColumn : curCol
  const calWidth = cols.map((it) => Math.floor(colNum * (it / allPart)))
  return {
    ...tableDefaultConfig,
    columns: calWidth.map((it) => ({
      alignment: alignment ?? "justify",
      width: it,
    })),
  }
}

const printTable = (data: unknown[][], userConfig?: TableUserConfig) =>
  console.log(table(data, userConfig))
const printErr = (str: string) => console.log(color.red(str))

const matchReplace = (str: string, reg: RegExp, color: ChalkInstance) =>
  str.replace(reg, (match) => color(match))
const mark = {
  singleQuotes: (str: string) => matchReplace(str, /'([^']+)'/g, color.green),
  doubleQuotes: (str: string) => matchReplace(str, /"([^"]+)"/g, color.maroon),
  path: (str: string) =>
    matchReplace(str, /(\.\.\/)?([\w-]+\/)*[\w-]+\.\w+/g, color.mauve),
  number: (str: string) => matchReplace(str, /\s(\d+)\s/g, color.sky),
}

const printCmdLog = (str: string) => {
  let tmp = str
  Object.values(mark).forEach((it) => {
    tmp = it(tmp)
  })
  console.log(tmp)
}

const oraText = (str: string) => style.bold(str)

const title = (strs: string[]) =>
  strs.map((str) => color.green(style.bold(str)))

export {
  printCmdLog,
  printErr,
  printTable,
  tableConfig,
  oraText,
  title,
  tableDefaultConfig,
  terminal,
  mark,
}
