import { table, type TableUserConfig } from "table"
import { terminal } from "./platform-utils"

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
  const sum = (numbers: number[]) => numbers.reduce((sum, it) => (sum += it), 0)
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

function tableDataPartation<T>(data: T[], pageSize: number = 5): T[][] {
  return data.reduce((result, item, index) => {
    const chunkIndex = Math.floor(index / pageSize)
    if (!result[chunkIndex]) {
      result[chunkIndex] = []
    }
    result[chunkIndex].push(item)
    return result
  }, [] as T[][])
}

export { tableConfig, printTable, tableDataPartation, tableDefaultConfig }
