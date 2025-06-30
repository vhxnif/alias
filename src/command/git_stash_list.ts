#!/usr/bin/env bun
import { Command } from "commander"
import { stashList } from "../action/stash-command"
import { color, tableTitle } from "../utils/color-utils"
import { errParse } from "../utils/command-utils"
import { isEmpty, printErr } from "../utils/common-utils"
import { printTable, tableConfig } from "../utils/table-utils"

new Command()
  .name("gsl")
  .description("git stash list")
  .action(async () => {
    const stashInfos = await stashList()
    if (isEmpty(stashInfos)) {
      printErr("Stash Is Empty.")
      return
    }
    const data = stashInfos.map((it) => [
      color.yellow(it.reflog),
      color.blue(it.reflogSubject),
      color.pink(it.anthor),
      color.mauve(it.createTime),
    ])
    printTable(
      [tableTitle(["StashNo", "Message", "Author", "Date"]), ...data],
      tableConfig({ cols: [1, 3, 1, 1] })
    )
  })
  .parseAsync()
  .catch(errParse)
