#!/usr/bin/env bun
import { Command } from "commander"
import { branchList, branchNames, pageTable } from "../action/git-common-action"
import { color } from "../utils/color-utils"
import { tableDefaultConfig } from "../utils/table-utils"
import { printErr } from "../utils/common-utils"

new Command()
  .name("gbl")
  .description("git branch -l / git branch -a")
  .argument("[name]", "barnch name", "")
  .option("-a, --all", "list all", false)
  .action(async (name, { all }) => {
    const execText = await branchList({ all, name })
    const data = branchNames(execText, false).map((it) => [it])
    const parse = (names: string[]) => {
      return names.map((it) =>
        it.startsWith("*")
          ? color.yellow(it.replace("*", "").trim())
          : color.blue(it.trim()),
      )
    }
    await pageTable({
      titleStr: ["Branch Name"],
      data,
      config: () => tableDefaultConfig,
      rowParse: parse,
    })
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
