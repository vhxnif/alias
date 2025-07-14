#!/usr/bin/env bun
import { Command } from "commander"
import { exec } from "../utils/platform-utils"
import { logcmd } from "../utils/command-log-format"
import { errParse } from "../utils/common-utils"
import { Spinner } from "../utils/ora-utils"

new Command()
  .name("gpl")
  .description("git pull")
  .argument("[remote]", "remote name")
  .action(async (remote) => {
    const spinner = new Spinner("Pulling from git...").start()
    try {
      const result = await exec(`git pull ${ remote ?? 'origin'}`)
      spinner.succeed("Git pull completed successfully")
      logcmd(result, "git-pull")
    } catch (error) {
      spinner.stop()
      throw error
    }
  })
  .parseAsync()
  .catch(errParse)
