import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocusTrap } from '@/hooks/use-focus-trap'

interface FAQModalProps {
  isOpen: boolean
  onClose: () => void
}

const faqs = [
  {
    question: 'What is this app?',
    answer:
      'BoardZilla is a visual board for managing Mozilla Bugzilla bugs. It lets you drag and drop bugs between status columns and batch-update them in Bugzilla.',
  },
  {
    question: 'How do I get a Bugzilla API key?',
    answer:
      'Log into bugzilla.mozilla.org, go to Preferences → API Keys, and generate a new key. Copy it and paste it here.',
  },
  {
    question: 'Is my API key secure?',
    answer:
      'Your API key is encrypted and stored locally in your browser. API requests pass through our open-source CORS proxy to reach Bugzilla (required due to browser security restrictions). We do not log or store your key. You can review the proxy code on GitHub.',
  },
  {
    question: 'What do the columns mean?',
    answer:
      'Columns map to Bugzilla statuses: Backlog (NEW, UNCONFIRMED), Todo (NEW with sprint tag), In Progress (ASSIGNED), In Testing (RESOLVED with qe-verify+ flag), Done (RESOLVED, VERIFIED, CLOSED).',
  },
  {
    question: 'How do I move a bug?',
    answer:
      "Drag a bug card from one column to another. The change is staged locally until you click 'Apply Changes' to update Bugzilla.",
  },
  {
    question: 'What happens when I click Apply Changes?',
    answer:
      'All your staged changes are sent to Bugzilla in a batch. Successfully updated bugs will reflect their new status. Failed updates stay staged so you can retry.',
  },
  {
    question: 'Can I undo a staged change?',
    answer:
      "Staged changes are only applied when you click 'Apply Changes'. Before that, click the 'Clear' button on the staged changes panel to discard them, or refresh the page.",
  },
  {
    question: 'Why do I need to enter a filter?',
    answer:
      "Bugzilla has millions of bugs! Use the whiteboard tag or component filter to narrow down to the bugs you're working on.",
  },
]

export function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const dialogReference = useRef<HTMLDivElement>(null)

  // Trap focus within dialog when open
  useFocusTrap(dialogReference, isOpen)

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose()
            }
          }}
        >
          <motion.div
            ref={dialogReference}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-bg-secondary shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bg-tertiary px-6 py-4">
              <h2 id="faq-modal-title" className="text-xl font-bold text-text-primary">
                Frequently Asked Questions 🤔
              </h2>
              <button
                onClick={onClose}
                className="rounded p-1 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="Close FAQ"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* FAQ List */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="rounded-lg bg-bg-tertiary/50 p-4">
                    <h3 className="mb-2 flex items-start gap-2 font-bold text-text-primary">
                      <span className="material-icons text-accent-primary">help</span>
                      {faq.question}
                    </h3>
                    <p className="ml-8 text-sm text-text-secondary">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-bg-tertiary px-6 py-4">
              <p className="text-center text-sm text-text-tertiary">
                Still have questions? Check out the{' '}
                <a
                  href="https://github.com/msujaws/bugzilla-kanban"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary hover:underline"
                >
                  GitHub repo
                </a>{' '}
                or open an issue!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
