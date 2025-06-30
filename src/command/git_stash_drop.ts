#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { stashAction, stashDrop } from "../action/stash-command"

new Command()
  .name("gsd")
  .description("git stash drop")
  .action(async () => {
    await stashAction({
      command: stashDrop,
    })
  })
  .parseAsync()
  .catch(errParse)
