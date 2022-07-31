import { createFilter } from "@rollup/pluginutils"
import type { Plugin } from "rollup"
import { Project } from "ts-morph"
import { createImports } from "./create-imports"
import { getExportedNodes } from "./get-exported-nodes"
import { addRelatedNodes } from "./get-related-nodes"

const filter = createFilter("**/*.ts")

export function generateDtsPlugin({ tsconfig }: { tsconfig: string }): Plugin {
  const project = new Project({ tsConfigFilePath: tsconfig })

  return {
    name: "generate-dts-plugin",

    renderChunk(_code, chunk, _options) {
      if (!chunk.facadeModuleId) return
      if (!filter(chunk.facadeModuleId)) return

      const file = project.getSourceFileOrThrow(chunk.facadeModuleId)
      const imports: [string, string][] = []

      const nodesList = getExportedNodes(file)
      for (const node of nodesList) addRelatedNodes(node, nodesList, imports)
      const importDeclarations = createImports(imports, file)

      this.emitFile({
        fileName: `${chunk.name}-gen.ts`,
        type: "asset",
        source: [...importDeclarations, ...nodesList]
          .map((n) => n.print())
          .join("\n"),
      })

      return null
    },
  }
}
