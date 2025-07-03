#!/usr/bin/env bun
import { select } from "@inquirer/prompts"
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { isEmpty, printErr } from "../utils/common-utils"
import { exec, execPrint } from "../utils/platform-utils"
import { tagFormat } from "../utils/diff-utils"

new Command()
  .name("gts")
  .description("git tag show")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    const tags = (await exec(`git tag`).then((it) => it.split("\n"))).filter(
      (it) => (name ? it.includes(name) : true)
    )
    if (isEmpty(tags)) {
      printErr("Tags Is Empty.")
      return
    }
    const choices = tags.map((it) => ({ name: it, value: it }))
    const tag = await select({
      message: "Select A Tag: ",
      choices,
    })
    await execPrint(`git show ${tag}`, tagFormat)
  })
  .parseAsync()
  .catch(errParse)
