import path from "path"
import os from "node:os"
import { printErr } from "./common-utils"
import { $, ShellError } from "bun"
import { accessSync, constants, mkdirSync } from "node:fs"

const terminal: Record<string, number> = {
  column: process.stdout.columns,
  row: process.stdout.rows,
}

async function editor(content: string, f: (tmp: string) => Promise<void>) {
  const editor = Bun.env["EDITOR"]
  if (!editor) {
    printErr(`$EDITOR is missing`)
    return
  }
  const tmpFile = path.join(os.tmpdir(), `tmp-${Bun.randomUUIDv7()}.txt`)
  await Bun.write(tmpFile, content, { createPath: false })
  const proc = Bun.spawn([editor, tmpFile], {
    stdio: ["inherit", "inherit", "inherit"],
    tty: true,
  })
  await proc.exited
    .then(async () => await f(tmpFile))
    .finally(async () => await Bun.file(tmpFile).delete())
}

async function exec(command: string): Promise<string> {
  try {
    return await $`${{ raw: command }}`.text()
  } catch (err: unknown) {
    printErr((err as ShellError).stderr.toString())
    process.exit()
  }
}

async function tryExec(command: string): Promise<string> {
  return await $`${{ raw: command }}`.text()
}

function env(key: string): string | undefined {
  return process.env[`${key}`]
}

const platform = os.platform()

function platformConfigPath(): string {
  if (!["win32", "linux", "darwin"].includes(platform)) {
    throw Error(`${platform} not supported.`)
  }
  if (["linux", "darwin"].includes(platform)) {
    return `${env("HOME")}${path.sep}.config`
  }
  return env("APPDATA")!
}

function configPath(): string | undefined {
  const pcp = platformConfigPath()
  const appName = "git_alias"
  const appConfig = `${pcp}${path.sep}${appName}`
  try {
    accessSync(pcp, constants.F_OK)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    throw Error(`platform: ${platform}, configPath missing. ${pcp}`)
  }
  try {
    accessSync(appConfig, constants.F_OK)
    return appConfig
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    mkdirSync(appConfig, { recursive: true })
    return appConfig
  }
}

export { exec, tryExec, editor, configPath, terminal, platform }
