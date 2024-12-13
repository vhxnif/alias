import { select } from "@inquirer/prompts"
import { table, type TableUserConfig } from "table"
import { color, style } from "./color-utils"

const terminal: Record<string, number> = {
    'column': process.stdout.columns,
    'row': process.stdout.rows
}

const sum = (numbers: number[]) => numbers.reduce((sum, it) => sum += it, 0)

const tableDefaultConfig: TableUserConfig = {
    border: {
        topBody: `─`,
        topJoin: `┬`,
        topLeft: `┌`,
        topRight: `┐`,

        bottomBody: `─`,
        bottomJoin: `┴`,
        bottomLeft: `└`,
        bottomRight: `┘`,

        bodyLeft: `│`,
        bodyRight: `│`,
        bodyJoin: `│`,

        joinBody: `─`,
        joinLeft: `├`,
        joinRight: `┤`,
        joinJoin: `┼`
    }
}

const tableConfig = (cols: number[], maxCol: number = 70): TableUserConfig => {
    const allPart = sum(cols)
    const curCol = terminal.column - (4 * cols.length) 
    const col = curCol > maxCol ? maxCol : curCol
    const calWidth = cols.map(it => Math.floor(col * (it / allPart)))
    return {
        ...tableDefaultConfig,
        columns: calWidth.map(it => ({
            alignment: 'center',
            width: it
        })),

    }
}
const printTable = (data: unknown[][], userConfig?: TableUserConfig) => console.log(table(data, userConfig))
const selectRun = async (message: string, choices: { name: string, value: string }[], f: (str: string) => void) => f(await select({ message, choices }))
const printErr = (str: string) => console.log(color.red(str))
const printCmdLog = (str: string) => console.log(
    str.replace(/'([^']+)'/g, match => color.green(match))
        .replace(/"([^"]+)"/g, match => color.maroon(match))
        .replace(/(\.\.\/)?([\w-]+\/)*[\w-]+\.\w+/g, match => color.mauve(match))
        .replace(/\++/g, match => color.red(match))
        .replace(/-+/g, match => color.green(match))
        .replace(/\s(\d+)\s/g, match => color.sky(match))
)

const oraText = (str: string) => style.bold(str)

const title = (strs: string[]) => strs.map(str => color.green(style.bold(str)))

export { printCmdLog, printErr, printTable, selectRun, tableConfig, oraText, title, tableDefaultConfig, terminal }

