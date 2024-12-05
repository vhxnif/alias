#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"


new Command()
    .name('gbr')
    .description('git merge <name>')
    .argument('[name]', 'barnch name', '')
    .action(async (name) => await git.branchRebase(name))
    .parseAsync()

