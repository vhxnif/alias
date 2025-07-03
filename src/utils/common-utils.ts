import type { ChalkInstance } from "chalk"
import { color } from "./color-utils"

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

function isEmpty<T>(param: string | T[] | undefined | null) {
  if (!param) {
    return true
  }
  if (typeof param === "string") {
    return param.length <= 0
  }
  const arr = param as Array<T>
  return arr.length <= 0
}

function lines(str: string, spliter: string = "\n"): string[] {
  return str
    .trim()
    .split(spliter)
    .map((it) => it.trim())
    .filter((it) => it)
}

export { printCmdLog, printErr, isEmpty, lines }
