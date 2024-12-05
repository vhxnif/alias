#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gsu')
    .description('git stash apply')
    .action(async () => await git.stashApply())
    .parseAsync()

