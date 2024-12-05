#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gfd')
    .description('git restore --staged')
    .action(async () => await git.restore())
    .parseAsync()

