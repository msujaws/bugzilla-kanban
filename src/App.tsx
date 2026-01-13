import { ToastContainer } from './components/Notifications/ToastContainer'
import { useStore } from './store'

function App() {
  const toasts = useStore((state) => state.toasts)
  const removeToast = useStore((state) => state.removeToast)

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <h1 className="text-4xl font-bold text-center py-8">
        Bugzilla Kanban - Where bugs go to chill 😎
      </h1>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default App
