import { useStore } from '@/store'

interface ApiKeyStatusProps {
  onOpenModal: () => void
}

export function ApiKeyStatus({ onOpenModal }: ApiKeyStatusProps) {
  const apiKey = useStore((state) => state.apiKey)
  const isValid = useStore((state) => state.isValid)
  const isValidating = useStore((state) => state.isValidating)
  const clearApiKey = useStore((state) => state.clearApiKey)
  const username = useStore((state) => state.username)

  // Determine current state
  const hasApiKey = Boolean(apiKey)
  const isAuthenticated = hasApiKey && isValid && !isValidating
  const isInvalid = hasApiKey && !isValid && !isValidating

  // Render unauthenticated state
  if (!hasApiKey) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-lg bg-bg-secondary px-4 py-2">
        <span className="material-icons text-text-tertiary">link_off</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">Not connected</p>
          <p className="text-xs text-text-secondary">Connect your API key to get started</p>
        </div>
        <button
          onClick={onOpenModal}
          className="rounded bg-accent-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-primary/80"
        >
          Connect
        </button>
      </div>
    )
  }

  // Render validating state
  if (isValidating) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-lg bg-bg-secondary px-4 py-2">
        <span className="material-icons animate-pulse text-accent-primary">hourglass_empty</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">Validating...</p>
          <p className="text-xs text-text-secondary">Checking your API key with Bugzilla</p>
        </div>
        <button
          onClick={clearApiKey}
          disabled={true}
          className="rounded border border-bg-tertiary bg-bg-tertiary px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:bg-bg-tertiary/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Logout
        </button>
      </div>
    )
  }

  // Render authenticated state
  if (isAuthenticated) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-lg bg-bg-secondary px-4 py-2">
        <span className="material-icons text-accent-success">check_circle</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">
            Connected as {username || 'Unknown'} 🎉
          </p>
          <p className="text-xs text-text-secondary">You&apos;re all set to manage bugs</p>
        </div>
        <button
          onClick={clearApiKey}
          className="rounded border border-bg-tertiary bg-bg-tertiary px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:bg-bg-tertiary/80"
        >
          Logout
        </button>
      </div>
    )
  }

  // Render invalid state
  if (isInvalid) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-lg bg-bg-secondary px-4 py-2">
        <span className="material-icons text-accent-error">error</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">Invalid key 😕</p>
          <p className="text-xs text-text-secondary">
            Your API key doesn&apos;t seem to be working
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenModal}
            className="rounded bg-accent-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-primary/80"
          >
            Reconnect
          </button>
          <button
            onClick={clearApiKey}
            className="rounded border border-bg-tertiary bg-bg-tertiary px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:bg-bg-tertiary/80"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return null
}
