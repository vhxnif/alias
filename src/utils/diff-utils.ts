import type { ChalkInstance } from "chalk"
import { color } from "./color-utils"

function lineSurgery(
  str: string,
  key: string,
  keyColor?: ChalkInstance
): (f: (s: string, i?: number) => string) => string {
  return (f: (s: string, i?: number) => string) =>
    str
      .split(key)
      .map(f)
      .join(keyColor ? keyColor(key) : key)
}

function lineParse({
  line,
  parse,
  parseAfter = (str: string) => str,
}: {
  line: string
  parse: Record<string, (str: string) => string>
  parseAfter?: (str: string) => string
}): string {
  const key = Object.keys(parse).find((k) => line.startsWith(k))
  if (key) {
    return parse[key](line)
  }
  return parseAfter ? parseAfter(line) : line
}

type ColorApply = (str: string) => string
function colorApply(c: ChalkInstance): ColorApply {
  return (l: string) => c(l)
}

type ParseStr = (str: string) => string
function diffLineFormat(): ParseStr {
  const thirdLayer = (s: string) => {
    const sp = (str: string) => {
      if (str.startsWith("-")) {
        return color.maroon(str)
      }
      if (str.startsWith("+")) {
        return color.teal(str)
      }
      return color.mauve(str)
    }
    return lineSurgery(s, ",")(sp)
  }

  const secondLayer = (s: string, i?: number) =>
    i !== 1 ? s : lineSurgery(s, " ")(thirdLayer)

  const parse: Record<string, ParseStr> = {
    "---": colorApply(color.blue),
    "-": colorApply(color.red),
    "+++": colorApply(color.yellow),
    "+": colorApply(color.green),
    "@@": (l) => lineSurgery(l, "@@", color.sky)(secondLayer),
  }
  return (s: string) =>
    lineParse({
      line: s,
      parse,
    })
}

function diffFormat(str: string): string {
  return lineSurgery(str, "\n")(diffLineFormat())
}

function tagFormat(s: string) {
  const parse = (line: string) => {
    const keyShow = (k: string, c: ChalkInstance) => (str: string) =>
      lineSurgery(str, k, color.teal)(colorApply(c))
    const parse: Record<string, ParseStr> = {
      tag: (str) => keyShow("tag", color.yellow)(str),
      "Tagger:": (str) => keyShow("Tagger:", color.green)(str),
      "Date:": (str) => keyShow("Date:", color.mauve)(str),
      "Author:": (str) => keyShow("Author:", color.flamingo)(str),
      "Merge:": (str) => keyShow("Merge:", color.pink)(str),
      commit: (str) => keyShow("commit", color.maroon)(str),
    }
    return lineParse({
      line,
      parse,
      parseAfter: diffLineFormat(),
    })
  }
  return lineSurgery(s, "\n")(parse)
}

export { diffFormat, tagFormat }
