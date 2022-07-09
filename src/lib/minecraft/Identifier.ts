type IdentifierTuple = [namespace:string, path:string]

function split (id: string, delimiter: string): IdentifierTuple {
  const result: IdentifierTuple = ['minecraft', id]

  const i = id.indexOf(delimiter)

  if (i >= 0) {
    result[1] = id.substring(i + 1, id.length)

    if (i >= 1) {
      result[0] = id.substring(0, i)
    }
  }

  return result
}

function isPathValid (path: string): boolean {
  for (let i = 0; i < path.length; i++) {
    const c = path.charCodeAt(i)

    if (!(c === 95 || c === 45 || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 47 || c === 46)) {
      return false
    }
  }

  return true
}

function isNamespaceValid (path: string): boolean {
  for (let i = 0; i < path.length; i++) {
    const c = path.charCodeAt(i)

    if (!(c === 95 || c === 45 || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 46)) {
      return false
    }
  }

  return true
}

export class Identifier {
  private readonly namespace: string
  private readonly path: string

  constructor (namespace: string, path: string) {
    if (!isNamespaceValid(namespace)) {
      throw new Error(`Non [a-z0-9_.-] character in namespace of location: "${namespace}:${path}"`)
    }

    if (!isPathValid(path)) {
      throw new Error(`Non [a-z0-9/._-] character in path of location: "${namespace}:${path}"`)
    }

    this.namespace = namespace
    this.path = path
  }

  public static of (id: string | Identifier): Identifier {
    if (typeof id === 'string') {
      const [namespace, path] = split(id, ':')

      return new Identifier(namespace, path)
    }

    return id
  }

  public getNamespace (): string {
    return this.namespace
  }

  public getPath (): string {
    return this.path
  }

  public toString (): string {
    return `${this.namespace}:${this.path}`
  }
}
