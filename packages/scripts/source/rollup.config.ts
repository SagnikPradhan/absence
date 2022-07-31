import { resolve } from "node:path"
import type { RollupOptions } from "rollup"
import typescript from "rollup-plugin-ts"
import { generateDtsPlugin } from "./plugin/index.js"

const root = (...a: string[]) => resolve(process.cwd(), ...a)

const configuration: RollupOptions = {
  input: root("source/index.ts"),

  plugins: [
    typescript({
      tsconfig: require.resolve("../tsconfig.build.json"),
      browserslist: "last 2 years and maintained node versions",
    }),

    generateDtsPlugin({
      tsconfig: resolve(process.cwd(), "tsconfig.json"),
    }),
  ],

  output: [
    {
      format: "cjs",
      dir: root("build"),
      entryFileNames: "index.js",
      exports: "auto",
      sourcemap: true,
    },

    {
      format: "esm",
      dir: root("build"),
      entryFileNames: "index.mjs",
      exports: "auto",
      sourcemap: true,
    },
  ],
}

export default configuration
