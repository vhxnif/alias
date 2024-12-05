#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gsd')
    .description('git stash drop')
    .action(async () => await git.stashDrop())
    .parseAsync()

