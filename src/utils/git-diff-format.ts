import type { ColorKey } from "./color-utils"
import { cleanFilePath } from "./common-utils"
import { terminal } from "./platform-utils"
import { color } from "./color-utils"

// git diff str parse

type PartChange = {
  oldStartLineNo: number
  oldContextCount: number
  newStartLineNo: number
  newContextCount: number
  lines: string[]
}

type GitDiff = {
  name: string
  parts: PartChange[]
}

type LineChangeType = "NORMAL" | "ADD" | "REMOVE"

type LineShow = {
  oldRowNo: string
  newRowNo: string
  change: LineChangeType
  line: string
}

type PartShow = {
  lines: LineShow[]
}

type DiffShow = {
  fileName: string
  parts: PartShow[]
}

function parseGitDiffStr(gitDiffStr: string): GitDiff[] {
  const lines: string[] = gitDiffStr.trim().split("\n")
  let diffPart = false
  return lines.reduce((arr, l) => {
    if (l.startsWith("index ")) {
      return arr
    }
    if (l.startsWith("diff --git")) {
      arr.push({ name: "", parts: [] } as GitDiff)
      diffPart = false
      return arr
    }
    const obj = arr.pop() ?? ({} as GitDiff)
    if (l.startsWith("---") || l.startsWith("+++")) {
      obj.name = l.substring(5)
    }
    if (l.startsWith("@@")) {
      diffPart = true
      const str = l.substring(3, l.lastIndexOf("@@") - 1)
      const [oldOne, newOne] = str
        .replace(/[+-]/, "")
        .split(" ")
        .map((it) => {
          const [num, ct] = it.split(",")
          return {
            start: Number(num),
            context: Number(ct),
          }
        })
      obj.parts.push({
        oldStartLineNo: oldOne.start,
        oldContextCount: oldOne.context,
        newStartLineNo: newOne.start,
        newContextCount: newOne.context,
        lines: [],
      })
      arr.push(obj)
      return arr
    }
    if (diffPart) {
      const pts = obj.parts
      pts[pts.length - 1].lines.push(l)
    }
    arr.push(obj)
    return arr
  }, [] as GitDiff[])
}

function mapToDiffShow(gitDiffs: GitDiff[]): DiffShow[] {
  return gitDiffs.map((it) => {
    const fileName = cleanFilePath(it.name, terminal.column, false)
    const parts = it.parts.map(partShowParse)
    return {
      fileName,
      parts,
    }
  })
}

function lineShowParse(
  l: string,
  oldStart: number,
  newStart: number,
  oldNoWidth: number,
  newNoWidth: number,
) {
  const type = lineChangeType(l)
  const { noSeq: oldNoSeq, rowNo: oldRowNo } = rowNoParse(
    type,
    "ADD",
    oldStart,
    oldNoWidth,
  )
  const { noSeq: newNoSeq, rowNo: newRowNo } = rowNoParse(
    type,
    "REMOVE",
    newStart,
    newNoWidth,
  )
  const lineShow: LineShow = {
    change: type,
    line: l,
    newRowNo,
    oldRowNo,
  }
  return {
    oldNoSeq,
    newNoSeq,
    lineShow,
  }
}

function lineChangeType(l: string): LineChangeType {
  if (l.startsWith("-")) {
    return "REMOVE"
  }
  if (l.startsWith("+")) {
    return "ADD"
  }
  return "NORMAL"
}

function rowNoParse(
  type: LineChangeType,
  notExpect: LineChangeType,
  noSeq: number,
  width: number,
) {
  if (type === notExpect) {
    return {
      noSeq,
      rowNo: "".padStart(width, " "),
    }
  }
  const rowNo = noSeq + 1
  const rowNoStr = `${rowNo}`
  return {
    noSeq: rowNo,
    rowNo: rowNoStr.padStart(width, " "),
  }
}

function partShowParse(p: PartChange): PartShow {
  const {
    oldStartLineNo,
    oldContextCount,
    newStartLineNo,
    newContextCount,
    lines: lineStrs,
  } = p
  let oldStart = oldStartLineNo - 1
  let newStart = newStartLineNo - 1
  const lines = lineStrs.map((l) => {
    const { oldNoSeq, newNoSeq, lineShow } = lineShowParse(
      l,
      oldStart,
      newStart,
      `${oldStartLineNo + oldContextCount}`.length,
      `${newStartLineNo + newContextCount}`.length,
    )
    oldStart = oldNoSeq
    newStart = newNoSeq
    return lineShow
  })
  return {
    lines,
  }
}

type DiffParseColor = {
  tableLine: ColorKey
  titleName: ColorKey
  oldRowNo: ColorKey
  newRowNo: ColorKey
  text: ColorKey
}

function diffShowStr(diff: DiffShow, colorName: DiffParseColor): string {
  const { tableLine, titleName, oldRowNo, newRowNo, text } = colorName
  const { fileName, parts } = diff
  const width = terminal.column
  const topLeft = `╭`
  const topRight = `╮`
  const bottomLeft = `╰`
  const bottomRight = `╯`
  const p = (l: number) => `─`.repeat(l)
  const partStrs = parts.map((it) => {
    const { lines } = it
    const arr: string[] = []
    const lineColor = (l: LineShow) => {
      if (l.change === "REMOVE") {
        return color.red
      }
      if (l.change === "ADD") {
        return color.green
      }
      return color[text]
    }
    lines.forEach((l) =>
      arr.push(
        `${color[oldRowNo](l.oldRowNo)} ${color[newRowNo](l.newRowNo)} ${lineColor(l)(l.line)}`,
      ),
    )
    return arr.join("\n")
  })
  const topLeftWidth = Math.floor((width - 2 - fileName.length) / 2)
  const topRightWidth = width - 2 - topLeftWidth - fileName.length
  const topLeftLine = `${topLeft}${p(topLeftWidth)}`
  const topRightLine = `${p(topRightWidth)}${topRight}`
  const lineColor = color[tableLine]
  const topLine = `${lineColor(topLeftLine)}${color[titleName](fileName)}${lineColor(topRightLine)}`
  const bottoomLine = lineColor(`${bottomLeft}${p(width - 2)}${bottomRight}`)
  return `${topLine}\n${partStrs.join(`\n ${lineColor(p(width - 2))} \n`)}\n${bottoomLine}`
}

function gitDiffParse(str: string, color?: DiffParseColor) {
  const diff = parseGitDiffStr(str)
  const diffShow = mapToDiffShow(diff)
  return diffShow.flatMap((it) =>
    diffShowStr(
      it,
      color ?? {
        tableLine: "overlay2",
        titleName: "mauve",
        oldRowNo: "yellow",
        newRowNo: "sky",
        text: "subtext1",
      },
    ),
  )
}

export { gitDiffParse, type DiffParseColor }
