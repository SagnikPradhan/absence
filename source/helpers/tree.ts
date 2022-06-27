enum Kind {
  ROOT,
  STATIC,
  PARAMETER,
  CATCH_ALL,
}

type Nullable<V> = V | null

interface Node<P, K = Kind> {
  type: K
  path: string
  data: Nullable<P>

  childIndex: string
  childValues: Node<P>[]
  childWild: Nullable<Node<P, Kind.PARAMETER | Kind.CATCH_ALL>>
}

const MULTI_SLASH_REGEX = /\/+|(?<!\/)($|^)/g

export class Tree<P> {
  root: Node<P, Kind.ROOT> = {
    type: Kind.ROOT,
    path: "/",
    data: null,

    childIndex: "",
    childValues: [],
    childWild: null,
  }

  /** Add new node */
  public add(path: string, data: P) {
    this.findAndInsert(path.replace(MULTI_SLASH_REGEX, "/"), data, this.root)
  }

  /** Finds branch and inserts node */
  private findAndInsert(path: string, data: P, node: Node<P>): void {
    const commonPrefixLength = this.findCommonPrefixLength(path, node.path)
    if (commonPrefixLength === 0) throw new Error("Cannot add child node")

    // Split edge
    if (commonPrefixLength < node.path.length) {
      const child: Node<P> = {
        path: node.path.slice(commonPrefixLength),
        type: node.type,
        data: node.data,
        childIndex: node.childIndex,
        childValues: node.childValues,
        childWild: node.childWild,
      }

      node.type = Kind.STATIC
      node.data = null
      node.childIndex = node.path[commonPrefixLength]
      node.path = node.path.slice(0, commonPrefixLength)
      node.childValues = [child]
      node.childWild = null
    }

    // Add child node
    if (commonPrefixLength < path.length) {
      path = path.slice(commonPrefixLength)
      const childIndex = path[0]

      for (let index = 0; index < node.childIndex.length; index++)
        if (childIndex === node.childIndex[index])
          return this.findAndInsert(path, data, node.childValues[index])

      return this.insertInNode(node, path, data)
    }

    // Set data to node
    if (node.data !== null) throw new Error(`Found duplicate routes`)
    else node.data = data
  }

  /** Find common prefix's length */
  private findCommonPrefixLength(a: string, b: string) {
    const m = Math.min(a.length, b.length)
    let index = 0
    while (index < m && a[index] === b[index]) index++
    return index
  }

  /** Tries inserting in the given node */
  private insertInNode(node: Node<P>, path: string, data: P) {
    const wildcard = this.findWildCard(path)

    // If there is a wildcard
    if (wildcard.startIndex > -1) {
      const parameter = path.slice(wildcard.startIndex, wildcard.endIndex + 1)
      const wildchildType =
        parameter[0] === ":" ? Kind.PARAMETER : Kind.CATCH_ALL

      // If there is a prefix before the wildcard
      if (wildcard.startIndex > 0) {
        const child: Node<P> = {
          type: Kind.STATIC,
          path: path.slice(0, wildcard.startIndex),
          data: null,
          childIndex: "",
          childValues: [],
          childWild: null,
        }

        node.childIndex += path[0]
        node.childValues.push(child)

        node = child
      }

      // If the child doesn't already exist
      if (!node.childWild)
        node.childWild = {
          path: parameter,
          type: wildchildType,
          data: null,
          childIndex: "",
          childValues: [],
          childWild: null,
        }
      else if (node.childWild.path !== parameter) {
        const setParameter = parameter.slice(0, -1)
        const existentParameter = node.childWild.path.slice(0, -1)

        throw new Error(
          `Found duplicate parameters at same position - ${setParameter}, ${existentParameter}`
        )
      }

      // If there are deeper nodes
      if (wildcard.endIndex + 1 < path.length)
        return this.findAndInsert(
          path.slice(wildcard.startIndex),
          data,
          node.childWild
        )

      // No deeper nodes
      if (node.childWild.data)
        throw new Error("A wild card route is already registered")

      node.childWild.data = data
      return
    }

    node.childIndex += path[0]

    node.childValues.push({
      type: Kind.STATIC,
      path,
      data,
      childIndex: "",
      childValues: [],
      childWild: null,
    })
  }

  /** Finds wild card start and end index, throw's if invalid path */
  private findWildCard(path: string) {
    let startIndex = -1
    let endIndex = path.length - 1
    let type: Nullable<Kind.PARAMETER | Kind.CATCH_ALL> = null

    for (let index = 0; index < path.length; index++) {
      if (path[index] === ":") {
        if (startIndex > -1) throw new Error("Invalid path")
        startIndex = index
        type = Kind.PARAMETER
      }

      if (path[index] === "*") {
        if (startIndex > -1) throw new Error("Invalid path")
        startIndex = index
        type = Kind.CATCH_ALL
        break
      }

      if (path[index] === "/") {
        if (startIndex > -1) {
          endIndex = index
          break
        }
      }
    }

    return { startIndex, endIndex, type }
  }

  /** Lookup a node */
  lookup(path: string) {
    let currentNode: Node<P> = this.root
    let data: Nullable<P> = null
    const parameters: Record<string, string> = {}

    NEXT_NODE: while (true) {
      if (path.length < currentNode.path.length) break

      if (path === currentNode.path) {
        data = currentNode.data
        break
      }

      if (path.slice(0, currentNode.path.length) !== currentNode.path) break
      else path = path.slice(currentNode.path.length)

      const character = path[0]
      const childIndex = currentNode.childIndex

      for (let index = 0; index < childIndex.length; index++) {
        if (character === childIndex[index]) {
          currentNode = currentNode.childValues[index]
          continue NEXT_NODE
        }
      }

      if (currentNode.childWild) {
        const wildChild = currentNode.childWild
        let parameterEndIndex = 0

        if (wildChild.type === Kind.PARAMETER)
          while (
            path[parameterEndIndex] !== "/" &&
            parameterEndIndex < path.length
          )
            parameterEndIndex++
        else parameterEndIndex = path.length - 1

        parameters[wildChild.path.slice(1, -1)] = path.slice(
          0,
          parameterEndIndex
        )

        path = path.slice(parameterEndIndex + 1)

        if (path.length > 0) {
          const character = path[0]
          const childIndex = wildChild.childIndex

          for (let index = 0; index < childIndex.length; index++) {
            if (character === childIndex[index]) {
              currentNode = wildChild.childValues[index]
              continue NEXT_NODE
            }
          }
        } else data = wildChild.data
      }
    }

    if (data) return { data, parameters }
    else return null
  }
}
