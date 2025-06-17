#!/usr/bin/env bun
import { Command } from "commander"
import { branchNames, pageTable } from "../action/git-common-action"
import { color } from "../utils/color-utils"
import { exec } from "../utils/platform-utils"
import { tableDefaultConfig } from "../utils/table-utils"

new Command()
  .name("gbl")
  .description("git branch -l / git branch -a")
  .argument("[name]", "barnch name", "")
  .option("-a, --all", "list all", false)
  .action(async (name, option) => {
    const data = await exec(`git branch ${option.all ? "-a" : "-l"}`)
      .then((logs) => branchNames(logs, false, name))
      .then((names) => names.map((it) => [it]))
    const parse = (names: string[]) => {
      return names.map((it) =>
        it.startsWith("*")
          ? color.yellow(it.replace("*", "").trim())
          : color.blue(it.trim())
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
