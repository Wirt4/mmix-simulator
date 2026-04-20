import { execSync } from "child_process"
import fs from "fs"
import path from "path"

export default function () {
  const wasmJs = path.resolve(process.cwd(), "wasm/build/wasm/mmix.js")
  if (!fs.existsSync(wasmJs)) {
    execSync("make wasm", {
      cwd: path.resolve(process.cwd(), "wasm"),
      stdio: "inherit",
    })
  }
}
