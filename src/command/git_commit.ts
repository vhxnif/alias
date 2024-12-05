#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gc')
    .description('git commit -m')
    .action(async () => await git.commit())
    .parseAsync()

