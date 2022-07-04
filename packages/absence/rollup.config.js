import terser from "rollup-plugin-terser"
import typescript from "rollup-plugin-ts"

/** @type {import("rollup").RollupOptions} */
const config = {
  input: "./source/index.ts",

  output: [
    { file: "./build/index.js", format: "cjs", sourcemap: true },
    { file: "./build/index.mjs", format: "esm", sourcemap: true },
  ],

  plugins: [
    typescript({
      transpiler: "babel",
      browserslist: "current node",
      tsconfig: "./tsconfig.json",
    }),

    terser.terser(),
  ],
}

export default config
