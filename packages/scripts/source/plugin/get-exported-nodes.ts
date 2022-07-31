import t, { SyntaxKind, ts } from "ts-morph"

export type Node =
  | t.TypeAliasDeclaration
  | t.InterfaceDeclaration
  | t.FunctionDeclaration
  | t.ExportDeclaration

export function getExportedNodes(
  file: t.SourceFile
  // importMap: Map<t.ImportDeclaration, t.ImportSpecifier[]>
) {
  const nodes = new Set<Node>()

  // const imports = new Set<t.ImportDeclaration>()
  const exportKeywords = file.getDescendantsOfKind(SyntaxKind.ExportKeyword)

  NEXT_EXPORT: for (const exportKeyword of exportKeywords) {
    const exportKeywordParent = exportKeyword.getParentOrThrow()

    // export interface ...
    // export type ...
    if (
      exportKeywordParent.isKind(SyntaxKind.TypeAliasDeclaration) ||
      exportKeywordParent.isKind(SyntaxKind.InterfaceDeclaration)
    ) {
      nodes.add(exportKeywordParent)
      continue NEXT_EXPORT
    }

    // export function ...
    // export default function ...
    if (exportKeywordParent.isKind(SyntaxKind.FunctionDeclaration)) {
      nodes.add(getDeclareFunctionNode(exportKeywordParent))
      continue NEXT_EXPORT
    }

    // export {...} from "..."
    // export * from "..."
    if (exportKeywordParent.isKind(SyntaxKind.ExportDeclaration)) {
      const isNodeModuleFile = !exportKeywordParent.isModuleSpecifierRelative()

      // If it is not a relative file, it's assumed to be a node module
      // node modules are added by namespaces
      if (isNodeModuleFile) {
        nodes.add(exportKeywordParent.toNamespaceExport())
        continue NEXT_EXPORT
      }

      // Read the relative file
      const file = exportKeywordParent.getModuleSpecifierSourceFileOrThrow()
      const fileNodes = getExportedNodes(file)
      const exportKeywordNextSibling = exportKeyword.getNextSiblingOrThrow()

      // export * from "..."
      // Add all the nodes from the file
      if (exportKeywordNextSibling.isKind(SyntaxKind.AsteriskToken)) {
        for (const fileNode of fileNodes) nodes.add(fileNode)
      }

      // export {} from "..."
      // Need to filter the nodes and add only imported
      if (exportKeywordNextSibling.isKind(SyntaxKind.NamedExports)) {
        const specifiers = exportKeywordNextSibling.getElements()

        // All export declarations are included by default,
        // As they are usually namespace exports of node modules
        // If there is an export specifier which matches the export name add it too
        for (const node of fileNodes)
          if (
            node.isKind(SyntaxKind.ExportDeclaration) ||
            specifiers.some((s) => s.getName() === node.getName())
          )
            nodes.add(node)

        // We convert export {} from "..." to export {}
        exportKeywordParent.removeModuleSpecifier()
        nodes.add(exportKeywordParent)
      }
    }
  }

  return nodes
}

export function getDeclareFunctionNode(declaration: t.FunctionDeclaration) {
  if (!declaration.getReturnTypeNode())
    declaration.setReturnType(
      declaration
        .getReturnType()
        .getText(undefined, ts.TypeFormatFlags.InElementType)
    )

  declaration.removeBody()
  declaration.setIsAsync(false)
  declaration.setHasDeclareKeyword(true)

  return declaration
}
