import typescript from "rollup-plugin-ts"
import terser from "rollup-plugin-terser"

/** @type {import("rollup").RollupOptions} */
const config = {
  input: "./source/index.ts",
  output: { file: "./build/index.js", format: "cjs", sourcemap: true },
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
