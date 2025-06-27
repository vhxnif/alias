#!/usr/bin/env bun
import { Command } from "commander"
import { selectAction, tagFormat } from "../action/git-common-action"
import { isEmpty, printErr } from "../utils/common-utils"
import { exec } from "../utils/platform-utils"

new Command()
  .name("gts")
  .description("git tag show")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    const tags = (await exec(`git tag`).then((it) => it.split("\n"))).filter(
      (it) => (name ? it.includes(name) : true),
    )
    if (isEmpty(tags)) {
      printErr("Tags Is Empty.")
      return
    }
    const choices = tags.map((it) => ({ name: it, value: it }))
    await selectAction({
      message: "Select A Tag: ",
      action: (s: string) => `git show ${s}`,
      choices,
      isPrint: true,
      format: tagFormat,
    })
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
