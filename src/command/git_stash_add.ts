#!/usr/bin/env bun
import { Command } from "commander"
import { stashAdd } from "../action/stash-command"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gsa")
  .argument("<name>")
  .description("git stash push -m")
  .action(async (name) => {
    await stashAdd(name)
  })
  .parseAsync()
  .catch(errParse)
