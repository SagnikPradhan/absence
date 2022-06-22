function isTree<K, V>(array: any[]): array is U.RecursiveEntries<K, V[]> {
  return array.every((v) => Array.isArray(v))
}

/**
 * Assigns a property in recursive entries
 * @param options.tree - Tree, recursive entries
 * @param options.path - Path, array of keys
 * @param options.value - Value to be assigned
 * @returns Mutated tree
 */
export function assign<K, V>(options: {
  tree: U.RecursiveEntries<K, V[]>
  path: K[]
  value: U.RecursiveEntries<K[], V> | V
}) {
  const path = [...options.path]

  const property = path.shift()
  if (property === undefined) throw new Error("Empty keys")
  const entry = options.tree.find(([x]) => x === property)

  // Property already exists
  if (entry) {
    const value = entry[1]
    // Property is a collection
    if (isTree(value)) assign({ tree: value, path, value: options.value })
    else {
      // Property is not a collection, while value is
      if (Array.isArray(options.value)) throw new Error("Invalid call")
      // Property is not a collection, value is neither
      else value.push(options.value)
    }
  }

  // Property needs to be created
  else {
    // Last key
    if (path.length === 0) {
      // If the value is a collection
      if (Array.isArray(options.value)) {
        // Run set on all its entries
        options.tree.push([
          property,
          options.value.reduce<U.RecursiveEntries<K, V[]>>(
            (tree, [path, value]) => (assign({ tree, path, value }), tree),
            []
          ),
        ])
      } else options.tree.push([property, [options.value]])
    } else {
      const tree = [] as U.RecursiveEntries<K, V[]>
      assign({ tree, path, value: options.value })
      options.tree.push([property, tree])
    }
  }

  return options.tree
}

/**
 * Match values from tree
 * @param options.tree - Recursive entries
 * @param options.keys - Path
 * @param options.comparator - Compare if two keys are equal
 * @returns Array of matched values
 */
export function match<K, V, C>(options: {
  tree: U.RecursiveEntries<K, V[]>
  keys: C[]
  comparator: (a: C, b: K) => boolean
}) {
  const keys = [...options.keys]
  const currentKey = keys.shift()
  if (currentKey === undefined) return []

  return options.tree
    .filter(([key]) => options.comparator(currentKey, key))
    .flatMap(([_, value]): V | V[] =>
      isTree(value) ? match({ tree: value, keys, comparator: options.comparator }) : value
    )
}
