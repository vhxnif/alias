#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { stashPop } from "../action/stash-command"

new Command()
  .name("gsp")
  .description("git stash pop")
  .action(async () => {
    await stashPop()
  })
  .parseAsync()
  .catch(errParse)
