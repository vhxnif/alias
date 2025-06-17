#!/usr/bin/env bun
import { Command } from "commander"
import { stashAction } from "../action/git-common-action"

new Command()
  .name("gss")
  .description("git stash show")
  .action(async () => {
    await stashAction({
      action: (s: string) => `git stash show -p ${s}`,
      isPrint: true,
    })
  })
  .parseAsync()
