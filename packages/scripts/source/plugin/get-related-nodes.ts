import { SyntaxKind } from "ts-morph"
import {
  getDeclareFunctionNode,
  getExportedNodes,
  Node,
} from "./get-exported-nodes"

export function addRelatedNodes(
  node: Node,
  nodes: Set<Node>,
  imports: [string, string][]
) {
  if (node.isKind(SyntaxKind.ExportDeclaration)) return

  const references = node.getDescendantsOfKind(SyntaxKind.TypeReference)

  for (const ref of references) {
    const identifier = ref.getFirstChildByKindOrThrow(SyntaxKind.Identifier)
    const symbol = identifier.getSymbolOrThrow()
    const symbolDeclaration = symbol.getDeclarations().at(0)

    if (!symbolDeclaration || nodes.has(symbolDeclaration as Node)) continue

    // If the value was exported, it was already added in the set
    // We need to find the local types
    if (
      symbolDeclaration.isKind(SyntaxKind.TypeAliasDeclaration) ||
      symbolDeclaration.isKind(SyntaxKind.InterfaceDeclaration)
    ) {
      if (symbolDeclaration.hasExportKeyword()) continue

      if (
        symbolDeclaration
          .getSourceFile()
          .getFilePath()
          .includes("typescript/lib")
      )
        continue

      nodes.add(symbolDeclaration)
    }

    if (symbolDeclaration.isKind(SyntaxKind.FunctionDeclaration)) {
      if (symbolDeclaration.hasExportKeyword()) continue
      else nodes.add(getDeclareFunctionNode(symbolDeclaration))
    }

    // If the value was imported from another file
    // We resolve the import
    if (symbolDeclaration.isKind(SyntaxKind.ImportSpecifier)) {
      const specifierName = symbolDeclaration.getName()
      const importDeclaration = symbolDeclaration.getImportDeclaration()
      const isNodeModule = !importDeclaration.isModuleSpecifierRelative()

      // If it is a node module we add the namespaced import directly
      // We hold the instance of import declarations and their specifiers
      // In case we want to add more specifiers, we later remove the extra
      if (isNodeModule) {
        imports.push([
          importDeclaration.getModuleSpecifierValue(),
          specifierName,
        ])

        continue
      }

      const file = importDeclaration.getModuleSpecifierSourceFileOrThrow()
      const fileNodes = getExportedNodes(file)

      for (const node of fileNodes) {
        if (node.isKind(SyntaxKind.ExportDeclaration)) continue
        if (node.getName() !== specifierName) continue

        nodes.add(node)
        break
      }
    }
  }
}
