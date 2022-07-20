import { resolve } from "node:path"
import typescript from "rollup-plugin-ts"

const root = (...a) => resolve(process.cwd(), ...a)

/** @type {import("rollup").RollupOptions} */
const configuration = {
  input: root("source/index.ts"),

  plugins: [
    typescript({
      tsconfig: require.resolve("./tsconfig.build.json"),
      browserslist: "last 2 years and maintained node versions",
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
