#!/usr/bin/env bun
import { Command } from "commander"
import { fileStatus } from "../action/file-command"
import { color, tableTitle } from "../utils/color-utils"
import { errParse } from "../utils/command-utils"
import { isEmpty } from "../utils/common-utils"
import { printTable, tableConfig } from "../utils/table-utils"

new Command()
  .name("gs")
  .description("git status")
  .action(async () => {
    const logs = await fileStatus()
    if (isEmpty(logs)) {
      return
    }
    const data = logs.map((it) => [
      color.sky(it.stageStatus),
      color.flamingo(it.workStatus),
      color.blue(it.filePath),
    ])
    printTable(
      [tableTitle(["Stash", "Change", "File"]), ...data],
      tableConfig({ cols: [1, 1, 4] })
    )
  })
  .parseAsync()
  .catch(errParse)
