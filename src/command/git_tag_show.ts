#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
  .name("gts")
  .description("git tag show")
  .argument("[name]", "barnch name", "")
  .action(async (name) => await git.tagShow(name))
  .parseAsync()
