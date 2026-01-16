import { useCallback, useRef, useEffect } from 'react'

type AnyFunction = (...args: unknown[]) => void

interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void
  flush: () => void
  cancel: () => void
}

/**
 * Creates a debounced version of a callback function.
 * The callback will only be invoked after the specified delay
 * has passed since the last call.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced function with flush and cancel methods
 */
export function useDebouncedCallback<T extends AnyFunction>(
  callback: T,
  delay: number,
): DebouncedFunction<T> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const callbackRef = useRef(callback)
  const argsRef = useRef<Parameters<T>>()

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (argsRef.current) {
      callbackRef.current(...argsRef.current)
    }
  }, [])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    argsRef.current = undefined
  }, [])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
        timeoutRef.current = undefined
      }, delay)
    },
    [delay],
  ) as DebouncedFunction<T>

  // Attach flush and cancel methods
  debouncedCallback.flush = flush
  debouncedCallback.cancel = cancel

  return debouncedCallback
}
