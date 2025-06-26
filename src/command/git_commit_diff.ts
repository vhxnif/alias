#!/usr/bin/env bun
import { Command } from "commander"
import { isEmpty } from "../utils/common-utils"
import { select } from "@inquirer/prompts"
import { exec } from "../utils/platform-utils"
import { lines } from "../action/git-common-action"

function logCommand(
  limit?: number,
  author?: string,
  from?: string,
  to?: string,
) {
  let command = `git log --oneline --format="%h│%an│%s" --date=format:"%Y-%m-%d %H:%M:%S"`
  const initCommand = command
  if (limit) {
    command = `${command} -n ${limit}`
  }
  if (author) {
    command = `${command} --author=${author} -n ${limit}`
  }
  if (from) {
    command = `${command} --since="${from}"`
  }
  if (to) {
    command = `${command} --before="${to}"`
  }
  if (initCommand == command) {
    command = `${command} -n ${limit}`
  }
  return command
}

function message(str: string) {
  if (str.length <= 25) {
    return str
  }
  return `${str.substring(0, 24)}...`
}

new Command()
  .name("gld")
  .description("git log -n, defaule limit is 100")
  .option("-l, --limit <limit>")
  .option("-a, --author <author>")
  .option("-f, --from <from>", "yyyy-MM-dd")
  .option("-t, --to <to>", "yyyy-MM-dd")
  .action(async (option) => {
    const { limit, author, from, to } = option
    const logLimit = limit ?? 100
    const logs = await exec(logCommand(logLimit, author, from, to)).then(lines)
    if (isEmpty(logs)) {
      return
    }
    const choices = logs.map((it) => {
      const row = it.split("│")
      return {
        name: `${row[0]} ${row[1]} ${message(row[2])}`,
        value: row[0],
      }
    })
    const diff = (h: string) => {
      let f = false
      return choices.find((it) => {
        if (f) {
          return f
        }
        if (it.value === h) {
          f = true
        }
      })?.value
    }

    await select({
      message: "Selecet Commit:",
      choices,
    }).then(async (answer) => {
      const beforeCommit = diff(answer)
      if (beforeCommit) {
        console.log(await exec(`git diff ${beforeCommit} ${answer}`))
        return
      }
      await select({
        message: "Select Commit:",
        choices,
      }).then(async (bef) => {
        console.log(await exec(`git diff ${bef} ${answer}`))
      })
    })
  })
  .parseAsync()
