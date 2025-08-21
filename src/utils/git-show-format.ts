// git show --stat <commit or tag> format
import { color, display } from "./color-utils"
import {
  cleanFilePath,
  renderFileChange,
  renderSummaryLine,
} from "./git-format"
import { terminal } from "./platform-utils"

type GitShowFormatConfig = {
  filePathWidth?: number
}

function formatGitShow(
  detailStr: string,
  config?: GitShowFormatConfig,
): string {
  const lines = detailStr.split("\n")
  if (lines.length <= 4) return "" // Guard for empty/short input

  const headerEndIndex = lines.findIndex((line) => line.trim() === "")
  const statsStartIndex = lines.findIndex(
    (line) =>
      (line.startsWith(" ") && line.includes("|")) || isSummmaryLine(line),
  )

  const headerLines = lines.slice(0, headerEndIndex)

  const messageLines = lines.slice(
    headerEndIndex,
    statsStartIndex === -1 ? undefined : statsStartIndex,
  )

  const statLines = statsStartIndex === -1 ? [] : lines.slice(statsStartIndex)

  const formattedHeader = _formatDetailHeader(headerLines)
  const formattedMessage = _formatDetailMessage(messageLines)
  const formattedFileStats = _formatDetailFileStats(
    statLines,
    config?.filePathWidth ?? terminal.column * 0.75,
  )

  return [formattedHeader, formattedMessage, formattedFileStats]
    .filter(Boolean)
    .join("\n")
}

function isSummmaryLine(line: string) {
  return /^\s*\d+\s+files?\s+changed(,\s*\d+\s+insertions?\(\+\))?(,\s*\d+\s+deletions?\(-\))?\s*/.test(
    line,
  )
}
function _formatDetailHeader(headerLines: string[]): string {
  const { yellow, blue, sky, green, mauve, teal } = color
  const formattedLines: string[] = []
  headerLines.forEach((line) => {
    if (line.startsWith("commit")) {
      const hash = yellow(line.split(" ")[1])
      formattedLines.push(`${blue.bold("Commit:")} ${hash}`)
    } else if (line.startsWith("Merge:")) {
      const [_, oldHash, newHash] = line.split(" ")
      formattedLines.push(
        `${blue.bold("Merge:")} ${sky(oldHash)} ${green(newHash)}`,
      )
    } else if (line.startsWith("Author:")) {
      const [_, author, email] = line.split(" ")
      formattedLines.push(
        `${blue.bold("Author:")} ${mauve(author)} <${green(
          email.substring(1, email.length - 1),
        )}>`,
      )
    } else if (line.startsWith("Date:")) {
      const [_, date] = line.split("Date:")
      formattedLines.push(`${blue.bold("Date:")} ${teal(date)}`)
    }
  })
  return formattedLines.join("\n")
}

function _formatDetailMessage(messageLines: string[]): string {
  const singleQuotes = /'([^']+)'/g
  const doubleQuotes = /"([^"]+)"/g
  return messageLines
    .map((line) => {
      if (line.startsWith("    ")) {
        return line
          .replaceAll(singleQuotes, (m) => display.important.bold(m))
          .replaceAll(doubleQuotes, (m) => display.important.bold(m))
      }
      return line // Keep blank lines
    })
    .join("\n")
}

function _formatDetailFileStats(
  statLines: string[],
  pathWidth: number,
): string {
  const formattedLines: string[] = []
  statLines.forEach((line) => {
    if (line.startsWith(" ") && line.includes("|")) {
      const [file, change] = line.split("|")
      formattedLines.push(
        `${cleanFilePath(file, pathWidth)}|${renderFileChange(change)}`,
      )
    } else if (isSummmaryLine(line)) {
      formattedLines.push(renderSummaryLine(line))
    }
  })
  return formattedLines.join("\n")
}

export { type GitShowFormatConfig, formatGitShow }
