#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gsl')
    .description('git stash list')
    .action(async () => await git.stashList())
    .parseAsync()

