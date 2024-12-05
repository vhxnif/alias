#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gl')
    .description('git log -n')
    .argument('[limit]', 'limit', 5)
    .option('-a, --author <author>')
    .action(async (limit, option) => await git.log(limit, option.author))
    .parseAsync()

