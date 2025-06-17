#!/usr/bin/env bun
import { Command } from "commander"
import { statusShortLog, title } from "../action/git-common-action"
import { color } from "../utils/color-utils"
import { printTable, tableConfig } from "../utils/table-utils"
import { isEmpty } from "../utils/common-utils"

new Command()
  .name("gs")
  .description("git status")
  .action(async () => {
    const logs = await statusShortLog()
    if (isEmpty(logs)) {
      return
    }
    const data = logs.map((it) => [
      color.sky(it.stageStatus),
      color.flamingo(it.workStatus),
      color.blue(it.filePath),
    ])
    printTable(
      [title(["Stash", "Change", "File"]), ...data],
      tableConfig({ cols: [1, 1, 4] })
    )
  })
  .parseAsync()
