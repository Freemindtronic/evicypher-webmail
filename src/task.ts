import type { ReportDetails, Reporter, StateKey } from 'legacy-code/report'

export type ReportMessage<T extends StateKey> = {
  type: 'report'
  state: T
  details: T extends keyof ReportDetails ? ReportDetails[T] : undefined
}

export type MessageFromBackToFront<T> = T extends BackgroundTask<
  never,
  infer U,
  infer V,
  unknown
>
  ?
      | {
          type: 'request'
          request: U
        }
      | {
          type: 'result'
          result: V
        }
      | ReportMessage<StateKey>
  : never

export type MessageFromFrontToBack<T> = T extends BackgroundTask<
  never,
  unknown,
  unknown,
  infer U
>
  ?
      | {
          type: 'response'
          response: U
        }
      | { type: 'abort' }
  : never

/** A background task is an asynchronous generator piped with a foreground task. */
export type BackgroundTask<TInitialValue, TYielded, TReturn, TNext> = (
  initialValue: TInitialValue,
  reporter: Reporter,
  signal: AbortSignal
) => AsyncGenerator<TYielded, TReturn, TNext>

export type ForegroundTask<T> = T extends BackgroundTask<
  never,
  infer U,
  unknown,
  infer V
>
  ? () => AsyncGenerator<V, void, U>
  : never

/** Retreive the initial value from a background task. */
export type InitialValue<T> = T extends BackgroundTask<
  infer U,
  unknown,
  unknown,
  unknown
>
  ? U
  : never

/** Retreive the return value from a background task. */
export type ReturnValue<T> = T extends BackgroundTask<
  never,
  unknown,
  infer U,
  unknown
>
  ? U
  : never
