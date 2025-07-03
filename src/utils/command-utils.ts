import { printErr } from "./common-utils"

async function errParse(e: unknown) {
  if (e instanceof Error) {
    printErr(e.message)
    return
  }
  console.log(e)
}

export { errParse }
