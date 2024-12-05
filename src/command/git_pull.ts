#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gpl')
    .description('git pull')
    .action(async () => await git.pull())
    .parseAsync()

