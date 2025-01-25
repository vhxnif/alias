import {
  createPrompt,
  useState,
  useKeypress,
  makeTheme,
  type Theme,
} from "@inquirer/core"
import type { PartialDeep } from "@inquirer/type"

type ConfirmConfig = {
  data: string[]
  start?: number
  theme?: PartialDeep<Theme>
}

export default createPrompt<number, ConfirmConfig>((config, done) => {
  const { data, start } = config
  const [value, setValue] = useState(start ?? 0)
  const theme = makeTheme(config.theme)
  const prevIdx = (idx: number) => {
    const prev = idx - 1
    return prev < 0 ? idx : prev
  }
  const nextIdx = (idx: number) => {
    const next = idx + 1
    return next > data.length - 1 ? idx : next
  }
  useKeypress((key, rl) => {
    const show = (f: (i: number) => number) => {
      setValue(f(value))
      rl.clearLine(0)
      rl.write(data[value])
    }
    const isKey = (str: string) => key.name === str
    if (isKey("k")) {
      show(prevIdx)
    } else if (isKey("j")) {
      show(nextIdx)
    } else if (isKey("q")) {
      done(-1)
    }
  })
  const key = (str: string) => theme.style.key(str)
  const currPage = `${value + 1}/${data.length}`
  const message = `CurrPage ${key(currPage)}, NextPage ${key("j")}, PrevPage ${key("k")}, Exit ${key("q")}`
  return `${data[value]}${message}`
})
