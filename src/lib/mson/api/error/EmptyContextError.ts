export class EmptyContextError extends Error {
  constructor (message: string) {
    super(`Context is empty - ${message}`)
  }
}
