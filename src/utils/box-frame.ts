import { color, type ColorKey } from "./color-utils"
import { terminal } from "./platform-utils"

export type BoxFrameConfig = {
  tilteColor: ColorKey
  bolderColor: ColorKey
  terminalColumn?: number
}

export class BoxFrame {
  private readonly content: string[]
  private readonly title: string
  private readonly config: BoxFrameConfig

  private readonly lineTopLeft: string = `╭`
  private readonly lineTopRight: string = `╮`
  private readonly lineBottomLeft: string = `╰`
  private readonly lineBottomRight: string = `╯`
  private readonly lineBody: string = `─`

  constructor(title: string, content: string[], config?: BoxFrameConfig) {
    this.title = title
    this.content = content
    this.config = config ?? {
      tilteColor: "mauve",
      bolderColor: "overlay2",
    }
  }

  text(): string {
    const terminalWidth = this.config.terminalColumn ?? terminal.column
    const topLineSumWidth = terminalWidth - 4 - this.title.length
    const topLeftLineWidth = Math.floor(topLineSumWidth / 2)
    const topRightLineWidth = topLineSumWidth - topLeftLineWidth
    const partLineDraw = (body: number, s?: string, e?: string) =>
      this.colorLine(`${s ?? ""}${this.lineBody.repeat(body)}${e ?? ""}`)
    const topLeftStr = partLineDraw(topLeftLineWidth, this.lineTopLeft)
    const topRightStr = partLineDraw(topRightLineWidth, "", this.lineTopRight)
    const top = `${topLeftStr} ${this.colorTitle()} ${topRightStr}`
    const bottom = partLineDraw(
      terminalWidth - 2,
      this.lineBottomLeft,
      this.lineBottomRight,
    )
    const body = this.content.join(`\n ${partLineDraw(terminalWidth - 2)} \n`)
    return `${top}\n${body}\n${bottom}`
  }

  private colorLine(lineStr: string) {
    return color[this.config.bolderColor](lineStr)
  }

  private colorTitle() {
    return color[this.config.tilteColor](this.title)
  }
}
