#!/usr/bin/env bun
import { Command } from "commander"
import { stashAction } from "../action/git-common-action"

new Command()
  .name("gsd")
  .description("git stash drop")
  .action(async () => {
    await stashAction({
      action: (s: string) => `git stash drop ${s}`,
      isPrint: true,
    })
  })
  .parseAsync()
