#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { exec } from "../utils/platform-utils"
import { logcmd } from "../utils/command-log-format"

new Command()
  .name("gpl")
  .description("git pull")
  .action(async () => {
    logcmd(await exec("git pull"), "git-pull")
  })
  .parseAsync()
  .catch(errParse)
