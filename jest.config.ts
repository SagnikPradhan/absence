import fs from "fs"

import ts from "ts-jest/presets"
import type { Config } from "jest"

const workspaceNames = fs.readdirSync("./packages")

const config: Config = {
  projects: workspaceNames.map((workspaceName) => ({
    displayName: workspaceName,
    testEnvironment: "node",

    transform: { ...ts.defaults.transform },
    testMatch: [`<rootDir>/packages/${workspaceName}/__tests__/**/*.ts`],

    globals: {
      "ts-jest": {
        tsconfig: `<rootDir>/packages/${workspaceName}/tsconfig.json`,
      },
    },
  })),
}

export default config
