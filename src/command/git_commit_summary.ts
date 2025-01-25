#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gcs')
    .description('git commit summary')
    .option('-a, --author <author>')
    .option('-f, --from <from>', 'yyyy-MM-dd')
    .option('-t, --to <to>', 'yyyy-MM-dd')
    .action(async (option) => await git.summaryChanges(option.author, option.from, option.to))
    .parseAsync()

