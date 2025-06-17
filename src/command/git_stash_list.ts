#!/usr/bin/env bun
import { Command } from "commander"
import { stashInfo, title } from "../action/git-common-action"
import { color } from "../utils/color-utils"
import { isEmpty, printErr } from "../utils/common-utils"
import { printTable, tableConfig } from "../utils/table-utils"

new Command()
  .name("gsl")
  .description("git stash list")
  .action(async () => {
    const stashInfos = await stashInfo()
    if (isEmpty(stashInfos)) {
      printErr("Stash Is Empty.")
      return
    }
    const ds = [color.yellow, color.blue, color.pink, color.mauve]
    const data = stashInfos.map((row) => row.map((it, idx) => ds[idx]?.(it)))
    printTable(
      [title(["StashNo", "Message", "Author", "Date"]), ...data],
      tableConfig({ cols: [1, 3, 1, 1] })
    )
  })
  .parseAsync()
