#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gss')
    .description('git stash show')
    .action(async () => await git.stashShow())
    .parseAsync()

