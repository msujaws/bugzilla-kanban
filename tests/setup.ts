import { afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { server } from './mocks/server'
import { webcrypto } from 'node:crypto'

// Expose Node's Web Crypto API to jsdom (needed for ApiKeyStorage encryption)
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- crypto.subtle may be undefined in CI's jsdom
if (!globalThis.crypto?.subtle) {
  globalThis.crypto = webcrypto as Crypto
}

// Mock window.matchMedia for tests that use useReducedMotion hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: undefined,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})
