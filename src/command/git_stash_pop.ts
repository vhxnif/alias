#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gsp')
    .description('git stash pop')
    .action(async () => await git.stashPop())
    .parseAsync()

