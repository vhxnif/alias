#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"


new Command()
    .name('gbd')
    .description('git branch -D <name>')
    .argument('[name]', 'barnch name', '')
    .action(async (name) => await git.branchDelete(name))
    .parseAsync()

