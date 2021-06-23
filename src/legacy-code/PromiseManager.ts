/* eslint-disable unicorn/filename-case */
export class PromiseManager {
  _resolver: Array<(value: unknown) => void>
  _promiser: Array<Promise<unknown>>
  _isWaitingFromThen: boolean
  _isWaitingFromGet: boolean

  constructor() {
    this._resolver = []
    this._promiser = []
    this._addPromise()
    this._isWaitingFromThen = false
    this._isWaitingFromGet = false
  }

  _addPromise(): void {
    this._promiser.push(
      new Promise((resolve) => {
        this._resolver.push(resolve)
      }).then((res) => {
        if (this._isWaitingFromGet) {
          this._isWaitingFromGet = false
          this._addPromise()
          this._promiser.shift()
          this._resolver.shift()
        } else {
          this._isWaitingFromThen = true
        }

        return res
      })
    )
  }

  getPromise(): Promise<unknown> {
    if (this._isWaitingFromThen) {
      this._isWaitingFromThen = false
      this._addPromise()
      this._resolver.shift()
      return this._promiser.shift() as Promise<unknown>
    }

    this._isWaitingFromGet = true
    return this._promiser[0]
  }

  getPromiseWithTimeout(timeout: number): Promise<unknown> {
    if (this._isWaitingFromThen) {
      this._isWaitingFromThen = false
      this._addPromise()
      this._resolver.shift()
      return this._promiser.shift() as Promise<unknown>
    }

    setTimeout(this._resolver[0], timeout)
    this._isWaitingFromGet = true
    return this._promiser[0]
  }

  resolve(value?: unknown): void {
    if (this._isWaitingFromThen) {
      this.getPromise()
    }

    this._resolver[0](value)
  }
}
