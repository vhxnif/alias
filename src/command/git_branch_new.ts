#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"


new Command()
    .name('gbn')
    .description('git switch -c <name> / git switch -t <name>')
    .argument('<name>', 'barnch name')
    .option('-t, --track', 'git switch -t', false)
    .action(async (name, option) => await git.branchNew(name, option.track))
    .parseAsync()

