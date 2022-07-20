/** @type {import("jest").Config} */
const config = {
  rootDir: process.cwd(),
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/source/**/*.ts"],
  testEnvironment: "node",
  transform: { "^.+\\.tsx?$": require.resolve("ts-jest") },
  testMatch: [`<rootDir>/__tests__/**/*.ts`],
  globals: {
    "ts-jest": { tsconfig: require.resolve("./tsconfig.base.json") },
  },
}

module.exports = config
