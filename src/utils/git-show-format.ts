import type { ChalkInstance } from "chalk"
import { display } from "./color-utils"
import {
  cleanFilePath,
  renderFileChange,
  renderSummaryLine,
  formatColor,
} from "./git-format"
import { terminal } from "./platform-utils"
import { isEmpty } from "./common-utils"

type GitShowFormatConfig = {
  filePathWidth?: number
}

// git show --stat <commit>
function formatGitShow(
  detailStr: string,
  config?: GitShowFormatConfig,
): string {
  const lines = detailStr.split("\n")
  if (lines.length <= 4) return "" // Guard for empty/short input
  return _formatGitShow(lines, config)
}

function _formatGitShow(lines: string[], config?: GitShowFormatConfig): string {
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
  const { key, oldHash: oldHashColor, newHash: newHashColor } = formatColor
  const formattedLines: string[] = []
  headerLines.forEach((line) => {
    if (line.startsWith("commit")) {
      formattedLines.push(_formatHash(line))
    } else if (line.startsWith("Merge:")) {
      const [_, oldHash, newHash] = line.split(" ")
      formattedLines.push(
        `${key("Merge:")} ${oldHashColor(oldHash)} ${newHashColor(newHash)}`,
      )
    } else if (line.startsWith("Author:")) {
      formattedLines.push(_formatUser("Author:", line))
    } else if (line.startsWith("Date:")) {
      formattedLines.push(_formatDate(line))
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

// [userKey]: [user] <[email]>
function _formatUser(userKey: string, line: string): string {
  const { key, author: authorColor, email: emailColor } = formatColor
  const [_, author, email] = line.split(" ")
  return `${key(userKey)} ${authorColor(author)} <${emailColor(
    email.substring(1, email.length - 1),
  )}>`
}

// Date: [date]
function _formatDate(line: string): string {
  return _foramtKeyValue(line, "Date:", "Date:", formatColor.date)
}

// commit [hash]
function _formatHash(line: string): string {
  return _foramtKeyValue(line, "commit", "Commit:", formatColor.hash)
}
// tag [tagName]
function _formatTag(line: string): string {
  return _foramtKeyValue(line, "tag", "Tag:", formatColor.tag)
}

function _foramtKeyValue(
  line: string,
  split: string,
  keyName: string,
  valueColor: ChalkInstance,
): string {
  const [_, value] = line.split(split)
  return `${formatColor.key(keyName)} ${valueColor(value)}`
}

// git show --stat <tag>
function formatGitTagShow(
  tagShowStr: string,
  config?: GitShowFormatConfig,
): string[] {
  const lines = tagShowStr.split("\n")
  const tagInfoEndIndex = lines.findIndex((line) => line.startsWith("commit"))
  const tagInfo = lines.slice(0, tagInfoEndIndex)
  const commitInfo = lines.slice(tagInfoEndIndex)
  const tagFormat = tagInfo
    .map((it) => {
      if (it.startsWith("tag")) {
        return _formatTag(it)
      }
      if (it.startsWith("Tagger:")) {
        return _formatUser("Tagger:", it)
      }
      if (it.startsWith("Date:")) {
        return _formatDate(it)
      }
      return formatColor.text(it)
    })
    .join("\n")

  return [tagFormat, _formatGitShow(commitInfo, config)].filter(
    (it) => !isEmpty(it),
  )
}

export { type GitShowFormatConfig, formatGitShow, formatGitTagShow }
