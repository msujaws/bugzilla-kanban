import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import { useStore } from '@/store'

interface ApiKeyInputProps {
  isOpen: boolean
  onClose: () => void
  onOpenFAQ?: () => void
}

export function ApiKeyInput({ isOpen, onClose, onOpenFAQ }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('')

  const inputReference = useRef<HTMLInputElement>(null)

  const setStoreApiKey = useStore((state) => state.setApiKey)
  const isValidating = useStore((state) => state.isValidating)
  const validationError = useStore((state) => state.validationError)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputReference.current) {
      inputReference.current.focus()
    }
  }, [isOpen])

  // Clear input when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setApiKey('')
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: Event) => {
      const keyboardEvent = event as unknown as KeyboardEvent
      if (keyboardEvent.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      return
    }

    await setStoreApiKey(trimmedKey)

    // Close modal on success (when validation completes without error)
    if (!validationError) {
      onClose()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleSubmit(event as unknown as React.FormEvent)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-modal-title"
        className="w-full max-w-md rounded-lg bg-bg-secondary p-6 shadow-2xl"
      >
        <h2 id="api-key-modal-title" className="mb-2 text-2xl font-bold text-text-primary">
          Let&apos;s get you connected! 🔑
        </h2>
        <p className="mb-4 text-text-secondary">
          Enter your Bugzilla API key to start managing bugs like a boss. You can generate one in
          Bugzilla under{' '}
          <span className="font-mono text-accent-primary">Preferences → API Keys</span>.
        </p>

        <div className="mb-4 flex items-start gap-2 rounded border border-accent-primary/30 bg-accent-primary/10 p-3 text-sm text-accent-primary">
          <span className="material-icons text-base">lock</span>
          <p>
            <strong>Your key stays private.</strong> It&apos;s encrypted locally in your browser.
            Requests are proxied to Bugzilla via our open-source server — we don&apos;t log or store
            your key.
          </p>
        </div>

        {onOpenFAQ && (
          <p className="mb-4 text-center text-sm text-text-secondary">
            Have questions?{' '}
            <button
              type="button"
              onClick={onOpenFAQ}
              className="text-accent-primary hover:underline"
            >
              Check out our FAQ
            </button>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="api-key-input" className="mb-2 block text-text-primary">
              API Key
            </label>
            <input
              id="api-key-input"
              ref={inputReference}
              type="password"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value)
              }}
              onKeyDown={handleKeyDown}
              disabled={isValidating}
              className="w-full rounded border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary placeholder-text-tertiary focus:border-accent-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your Bugzilla API key"
            />
          </div>

          {validationError && (
            <div className="mb-4 rounded border border-accent-error/30 bg-accent-error/10 p-3 text-accent-error">
              <p className="font-bold">Oops! That didn&apos;t work 🤔</p>
              <p className="text-sm">{validationError}</p>
            </div>
          )}

          {isValidating && (
            <div className="mb-4 text-center text-accent-primary">
              <p>Validating your key... hang tight! ⏳</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isValidating || !apiKey.trim()}
              className="flex-1 rounded bg-accent-primary px-4 py-2 font-bold text-white transition-colors hover:bg-accent-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isValidating}
              className="flex-1 rounded border border-bg-tertiary bg-bg-tertiary px-4 py-2 font-bold text-text-primary transition-colors hover:bg-bg-tertiary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
