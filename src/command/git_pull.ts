#!/usr/bin/env bun
import { Command } from "commander"
import { exec } from "../utils/platform-utils"
import { logcmd } from "../utils/command-log-format"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gpl")
  .description("git pull")
  .argument("[remote]", "remote name")
  .action(async (remote) => {
    logcmd(await exec(`git pull ${ remote ?? 'origin'}`), "git-pull")
  })
  .parseAsync()
  .catch(errParse)
