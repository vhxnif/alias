#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
  .name("gl")
  .description("git log -n, defaule limit is 100")
  .option("-l, --limit <limit>")
  .option("-a, --author <author>")
  .option("-f, --from <from>", "yyyy-MM-dd")
  .option("-t, --to <to>", "yyyy-MM-dd")
  .action(
    async (option) =>
      await git.log(option.limit, option.author, option.from, option.to),
  )
  .parseAsync()
