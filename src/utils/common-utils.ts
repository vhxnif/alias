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

/**
 * 将日期转换为人类友好的相对时间字符串（例如 "1 day ago"）
 * @param date 目标日期（Date对象、时间戳或ISO字符串）
 * @param baseDate 基准日期（默认为当前时间）
 * @returns 人类友好的时间差字符串
 */
function timeAgo(
  date: Date | string | number,
  baseDate: Date | string | number = new Date()
): string {
  // 解析输入日期
  const parsedDate = date instanceof Date ? date : new Date(date)
  // 解析基准日期
  const parsedBaseDate =
    baseDate instanceof Date ? baseDate : new Date(baseDate)

  // 计算时间差（毫秒）
  const diff = parsedBaseDate.getTime() - parsedDate.getTime()
  if (diff < 0) return "just now" // 处理未来时间

  // 定义时间单位常量（毫秒）
  const SECOND = 1000
  const MINUTE = 60 * SECOND
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const MONTH = 30 * DAY // 近似值
  const YEAR = 365 * DAY // 近似值

  // 计算各时间单位
  const seconds = Math.floor(diff / SECOND)
  const minutes = Math.floor(diff / MINUTE)
  const hours = Math.floor(diff / HOUR)
  const days = Math.floor(diff / DAY)
  const months = Math.floor(diff / MONTH)
  const years = Math.floor(diff / YEAR)

  // 根据时间差选择合适单位
  if (years >= 1) return formatUnit(years, "year")
  if (months >= 1) return formatUnit(months, "month")
  if (days >= 1) return formatUnit(days, "day")
  if (hours >= 1) return formatUnit(hours, "hour")
  if (minutes >= 1) return formatUnit(minutes, "minute")
  return formatUnit(seconds, "second")
}

/**
 * 格式化时间单位（处理单复数）
 * @param value 时间值
 * @param unit 时间单位
 * @returns 格式化后的字符串
 */
function formatUnit(value: number, unit: string): string {
  if (value === 1) return `1 ${unit} ago`
  return `${value} ${unit}s ago`
}

export { printCmdLog, printErr, isEmpty, lines, timeAgo }
