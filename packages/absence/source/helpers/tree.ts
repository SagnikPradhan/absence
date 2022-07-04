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
  priority: number

  childIndex: string
  childValues: Node<P>[]
  childWild: Nullable<Node<P, Kind.PARAMETER | Kind.CATCH_ALL>>
}

export class Tree<P> {
  root: Node<P, Kind.ROOT> = {
    type: Kind.ROOT,
    path: "/",
    data: null,
    priority: 0,

    childIndex: "",
    childValues: [],
    childWild: null,
  }

  /** Finds branch and inserts node */
  public add(path: string, data: P, node: Node<P> = this.root): void {
    const commonPrefixLength = this.findCommonPrefixLength(path, node.path)
    // if (commonPrefixLength === 0) throw new Error("Cannot add child node")

    // Split edge
    if (commonPrefixLength < node.path.length) {
      const child: Node<P> = {
        path: node.path.slice(commonPrefixLength),
        type: node.type,
        data: node.data,
        priority: node.priority,
        childIndex: node.childIndex,
        childValues: node.childValues,
        childWild: node.childWild,
      }

      node.type = Kind.STATIC
      node.data = null
      node.childIndex = node.path[commonPrefixLength]
      node.path = node.path.slice(0, commonPrefixLength)
      node.priority += 1
      node.childValues = [child]
      node.childWild = null
    }

    // Add child node
    if (commonPrefixLength < path.length) {
      path = path.slice(commonPrefixLength)
      const childIndex = path[0]

      for (let index = 0; index < node.childIndex.length; index++)
        if (childIndex === node.childIndex[index]) {
          node.priority += 1
          this.add(path, data, node.childValues[index])
          this.sortOnPriorityFrom(index, node)
          return
        }

      node.priority += 1
      return this.insertInNode(node, path, data)
    }

    // Set data to node
    if (node.data !== null) throw new Error(`Found duplicate routes`)
    else node.data = data
  }

  /** Sort based on priority */
  private sortOnPriorityFrom(position: number, node: Node<P>) {
    const children = node.childValues
    const index = node.childIndex
    const priority = children[position].priority

    let newPosition = position
    while (newPosition > 0 && children[newPosition - 1].priority < priority) {
      ;[children[newPosition], children[newPosition - 1]] = [
        children[newPosition - 1],
        children[newPosition],
      ]
      newPosition--
    }

    if (newPosition !== position)
      node.childIndex =
        index.slice(0, newPosition) +
        index[position] +
        index.slice(newPosition, position) +
        index.slice(position + 1)
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
          priority: 1,
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
          priority: 0,
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
        if (wildchildType === Kind.PARAMETER)
          return this.add(path.slice(wildcard.startIndex), data, node.childWild)
        else throw new Error("Found path after catch all parameter")

      node.childWild.data = data
      return
    }

    node.childIndex += path[0]
    node.childValues.push({
      type: Kind.STATIC,
      path,
      data,
      priority: 0,
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
        if (startIndex > -1)
          throw new Error("Found multiple parameters in same segment")
        startIndex = index
        type = Kind.PARAMETER
      }

      if (path[index] === "*") {
        if (startIndex > -1)
          throw new Error("Found multiple parameters in same segment")
        startIndex = index
        type = Kind.CATCH_ALL
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
    let node: Node<P> = this.root
    let data: Nullable<P> = null
    const parameters: Record<string, string> = {}

    NEXT_NODE: while (true) {
      if (path.length > node.path.length) {
        if (path.slice(0, node.path.length) === node.path) {
          path = path.slice(node.path.length)

          const character = path[0]
          const childIndex = node.childIndex

          for (let index = 0; index < childIndex.length; index++) {
            if (character === childIndex[index]) {
              node = node.childValues[index]
              continue NEXT_NODE
            }
          }

          if (node.childWild) {
            node = node.childWild

            switch (node.type) {
              case Kind.PARAMETER:
                let slashIndex = 0
                while (slashIndex < path.length && path[slashIndex] !== "/")
                  slashIndex++

                parameters[node.path.slice(1, -1)] = path.slice(0, slashIndex)

                if (path.length > slashIndex + 1) {
                  if (node.childValues.length > 0) {
                    path = path.slice(slashIndex + 1)

                    const character = path[0]
                    const childIndex = node.childIndex

                    for (let index = 0; index < childIndex.length; index++) {
                      if (character === childIndex[index]) {
                        node = node.childValues[index]
                        continue NEXT_NODE
                      }
                    }
                  }

                  return null
                }

                if (node.data) return { data: node.data, parameters }
                else return null

              case Kind.CATCH_ALL:
                parameters[node.path.slice(1, -1)] = path

                return { data: node.data!, parameters }
            }
          }
        }
      } else if (path === node.path) {
        data = node.data
      }

      if (data) return { data, parameters }
      else return null
    }
  }
}
