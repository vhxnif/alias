#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gsa')
    .argument('<name>')
    .description('git stash push -m')
    .action(async (name) => await git.stashAdd(name))
    .parseAsync()

