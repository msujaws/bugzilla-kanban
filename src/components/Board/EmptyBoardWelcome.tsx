/**
 * Empty board welcome component - displays quick-start instructions
 * when no filters are set and the board is empty
 */

interface Step {
  number: number
  title: string
  description: string
  icon: string
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Enter your filters',
    description:
      'Use the whiteboard tag and component fields above to filter bugs. Click "Apply Filters" to load matching bugs.',
    icon: 'filter_alt',
  },
  {
    number: 2,
    title: 'Drag cards between columns',
    description:
      'Drag bug cards to move them between columns. Changes are staged locally until you apply them.',
    icon: 'drag_indicator',
  },
  {
    number: 3,
    title: 'Apply changes to Bugzilla',
    description: 'When ready, click the "Apply" button to save your staged changes to Bugzilla.',
    icon: 'cloud_upload',
  },
]

export function EmptyBoardWelcome() {
  return (
    <section
      role="region"
      aria-label="Getting started with BoardZilla"
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <h2 className="text-2xl font-bold text-text-primary mb-8">Get Started</h2>

      <div className="grid gap-6 md:grid-cols-3 max-w-4xl">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex flex-col items-center text-center p-6 rounded-lg bg-bg-secondary border border-bg-tertiary"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary text-white font-bold mb-4">
              {step.number}
            </div>
            <span className="material-icons text-4xl text-accent-primary mb-3">{step.icon}</span>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
            <p className="text-sm text-text-secondary">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
