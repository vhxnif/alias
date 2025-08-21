#!/usr/bin/env bun
import { select } from "@inquirer/prompts"
import { Command } from "commander"
import { errParse, isEmpty, printErr } from "../utils/common-utils"
import { exec, execPrint } from "../utils/platform-utils"
import { tagFormat } from "../utils/diff-utils"
import { formatGitShow } from "../utils/git-show-format"
import { BoxFrame } from "../utils/box-frame"
import { stringWidth } from "bun"

new Command()
  .name("gts")
  .description("git tag show")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    const tagsStr = await exec(`git tag`)
    if (isEmpty(tagsStr)) {
      printErr("Tags Is Empty.")
      return
    }
    const tags = tagsStr
      .split("\n")
      .filter((it) => (name ? it.includes(name) : true))
    console.log(tags)
    if (isEmpty(tags)) {
      printErr("Tags Is Empty.")
      return
    }
    const choices = tags.map((it) => ({ name: it, value: it }))
    const tag = await select({
      message: "Select A Tag: ",
      choices,
    })
    const tagShowStr = formatGitShow(await exec(`git show --stat ${tag}`))
    const width = tagShowStr
      .split("\n")
      .map((it) => Bun.stringWidth(it))
      .reduce((max, it) => {
        if (max > it) {
          return max
        }
        return it
      }, 0)
    console.log(
      new BoxFrame(tag, [tagShowStr], {
        width: width,
      }).text(),
    )
  })
  .parseAsync()
  .catch(errParse)
