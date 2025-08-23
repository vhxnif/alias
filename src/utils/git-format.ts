import type { ChalkInstance } from "chalk"
import { reg } from "./common-utils"
import { color } from "./color-utils"
import { stringWidth } from "bun"

type GitFormatColorKey =
  | "key"
  | "date"
  | "author"
  | "email"
  | "text"
  | "hash"
  | "add"
  | "remove"
  | "change"
  | "path"
  | "num"
  | "oldHash"
  | "newHash"
  | "tag"

const formatColor: Record<GitFormatColorKey, ChalkInstance> = {
  key: color.blue.bold,
  date: color.sky,
  author: color.mauve,
  email: color.green,
  text: color.subtext1,
  hash: color.yellow,
  add: color.green,
  remove: color.red,
  change: color.yellow,
  path: color.mauve,
  num: color.sapphire,
  oldHash: color.sky,
  newHash: color.green,
  tag: color.flamingo,
}

function cleanFilePath(
  file: string,
  widthLimit: number,
  withColor: boolean = true,
): string {
  const rf = (str: string) => {
    if (withColor) {
      return formatColor.path(str)
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
  const { add, remove, change, num } = formatColor
  const idx = str.lastIndexOf(" ")
  const number = str.substring(0, idx)
  const cg = str.substring(idx)

  const c1 = cg.match(/\+/g)
  const c2 = cg.match(/-/g)

  if (!c1 && !c2) {
    return str.replaceAll(/\d+/g, (m) => change(m))
  }
  if (c1 && c2) {
    let fg = add("+++")
    if (c1.length > c2.length) {
      fg = `${add("++")}${remove("-")}`
    }
    if (c1.length < c2.length) {
      fg = `${add("+")}${remove("--")}`
    }
    return `${num(number)} ${fg}`
  }
  if (c1) {
    return `${num(number)} ${add("+++")}`
  }
  return `${num(number)} ${remove("---")}`
}

function isSummmaryLine(line: string) {
  return /^\s*\d+\s+files?\s+changed(,\s*\d+\s+insertions?\(\+\))?(,\s*\d+\s+deletions?\(-\))?\s*/.test(
    line,
  )
}

function renderSummaryLine(line: string) {
  const { change, add, remove, num } = formatColor
  const mp: Record<string, ChalkInstance> = {
    file: change,
    files: change,
    changed: change,
    "+": add,
    insertions: add,
    insertion: add,
    "-": remove,
    deletion: remove,
    deletions: remove,
  }
  const ks = Object.keys(mp)
    .map((it) => it.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")
  return line
    .replace(reg.number, (m) => num(m))
    .replace(new RegExp(`\\b(${ks})\\b`, "g"), (m) => mp[m](m))
}

export {
  cleanFilePath,
  isSummmaryLine,
  renderFileChange,
  renderSummaryLine,
  formatColor,
}
