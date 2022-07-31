import type t from "ts-morph"

export function createImports(imports: [string, string][], file: t.SourceFile) {
  const parsedImports = imports.reduce<Record<string, string[]>>(
    (object, [id, specifier]) =>
      object[id]
        ? (object[id]!.push(specifier), object)
        : { ...object, [id]: [specifier] },
    {}
  )

  const importDeclarations: t.ImportDeclaration[] = []

  for (const id in parsedImports)
    importDeclarations.push(
      file.addImportDeclaration({
        moduleSpecifier: id,
        namedImports: [...new Set(parsedImports[id])],
        isTypeOnly: true,
      })
    )

  return importDeclarations
}
