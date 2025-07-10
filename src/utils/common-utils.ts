import type { ChalkInstance } from "chalk"
import { color } from "./color-utils"
import { stringWidth } from "bun"

const reg: Record<string, RegExp> = {
  curlyBraces: /\{([^{}]*)\}/g,
  singleQuotes: /'([^']+)'/g,
  doubleQuotes: /"([^"]+)"/g,
  number: /\d+/g,
}

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

async function errParse(e: unknown) {
  if (e instanceof Error) {
    printErr(e.message)
    return
  }
  console.log(e)
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

function cleanFilePath(
  file: string,
  widthLimit: number,
  withColor: boolean = true
): string {
  const rf = (str: string) => {
    if (withColor) {
      return color.mauve(str)
    }
    return str
  }
  const width = Math.floor(widthLimit * 0.75)
  if (stringWidth(file) <= width) {
    return rf(file)
  }
  const f = file
    .trim()
    .replace(".../", "")
    .split("/")
    .reverse()
    .reduce((arr, it) => {
      const r = `${arr.join("/")}/${it}/... `
      if (stringWidth(r) <= width) {
        arr.push(it)
      }
      return arr
    }, [] as string[])
    .reverse()
    .join("/")
  const str: string = ` .../${f}`
  const n = Math.floor((width - stringWidth(str)) / stringWidth(" "))
  const resStr = `${str}${" ".repeat(n)}  `
  return rf(resStr)
}

function renderFileChange(str: string): string {
  const { blue, green, red } = color
  const idx = str.lastIndexOf(" ")
  const number = str.substring(0, idx)
  const cg = str.substring(idx)

  const c1 = cg.match(/\+/g)
  const c2 = cg.match(/-/g)

  if (!c1 && !c2) {
    return str.replaceAll(/\d+/g, (m) => blue(m))
  }
  if (c1 && c2) {
    let fg = green("+++")
    if (c1.length > c2.length) {
      fg = `${green("++")}${red("-")}`
    }
    if (c1.length < c2.length) {
      fg = `${green("+")}${red("--")}`
    }
    return `${blue(number)} ${fg}`
  }
  if (c1) {
    return `${blue(number)} ${green("+++")}`
  }
  return `${blue(number)} ${red("---")}`
}

function isSummmaryLine(line: string) {
  return /^\s*\d+\s+files?\s+changed(,\s*\d+\s+insertions?\(\+\))?(,\s*\d+\s+deletions?\(-\))?\s*/.test(
    line
  )
}

function renderSummaryLine(line: string) {
  const { blue, yellow, green, red } = color
  const mp: Record<string, ChalkInstance> = {
    file: yellow,
    files: yellow,
    changed: yellow,
    "+": green,
    insertions: green,
    insertion: green,
    "-": red,
    deletion: red,
    deletions: red,
  }
  const ks = Object.keys(mp)
    .map((it) => it.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")
  return line
    .replace(reg.number, (m) => blue(m))
    .replace(new RegExp(`\\b(${ks})\\b`, "g"), (m) => mp[m](m))
}

export {
  printCmdLog,
  printErr,
  errParse,
  isEmpty,
  lines,
  cleanFilePath,
  renderFileChange,
  isSummmaryLine,
  renderSummaryLine,
  reg,
}
