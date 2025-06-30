import { printErr } from "./common-utils"

async function errParse() {
  return (e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
    }
  }
}

export { errParse }
