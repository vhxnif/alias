#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"


new Command()
    .name('gbl')
    .description('git branch -l / git branch -a')
    .argument('[name]', 'barnch name', '')
    .option('-a, --all', 'list all', false)
    .action(async (name, option) => await git.branchList(name, option.all))
    .parseAsync()

