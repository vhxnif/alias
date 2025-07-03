#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { stashAction, stashApply } from "../action/stash-command"

new Command()
  .name("gsu")
  .description("git stash apply")
  .action(async () => {
    await stashAction({
      command: stashApply,
    })
  })
  .parseAsync()
  .catch(errParse)
