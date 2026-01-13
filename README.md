# Bugzilla Kanban

> Where bugs go to chill

A visual Kanban board for Mozilla Bugzilla that lets you drag and drop bugs between status columns and batch-update them.

## Features

- **Visual Kanban Board**: See your bugs organized by status in a clean, dark-themed interface
- **Drag & Drop**: Move bugs between columns with smooth animations
- **Batch Updates**: Stage multiple changes and apply them all at once
- **Secure**: Your API key is encrypted and stored locally - never sent to any server except Bugzilla
- **Filter by Whiteboard Tag or Component**: Focus on the bugs that matter to you

## Status Columns

Bugs are organized into columns based on their Bugzilla status:

| Column      | Bugzilla Statuses |
| ----------- | ----------------- |
| Backlog     | NEW, UNCONFIRMED  |
| Todo        | ASSIGNED          |
| In Progress | IN_PROGRESS       |
| In Review   | RESOLVED          |
| Done        | VERIFIED, CLOSED  |

## Getting Started

### 1. Get a Bugzilla API Key

1. Log into [bugzilla.mozilla.org](https://bugzilla.mozilla.org)
2. Go to **Preferences** → **API Keys**
3. Generate a new API key
4. Copy the key

### 2. Use the App

1. Visit the app at your deployed URL
2. Paste your API key when prompted
3. Enter a whiteboard tag (e.g., `[kanban]`) or component to filter bugs
4. Click **Apply Filters** to load your bugs
5. Drag bugs between columns to change their status
6. Click **Apply Changes** to update Bugzilla

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/msujaws/bugzilla-kanban.git
cd bugzilla-kanban

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Scripts

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start development server       |
| `npm run build`         | Build for production           |
| `npm run preview`       | Preview production build       |
| `npm run test`          | Run unit tests                 |
| `npm run test:ui`       | Run unit tests with UI         |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e`      | Run Playwright E2E tests       |
| `npm run lint`          | Run ESLint                     |
| `npm run lint:fix`      | Fix ESLint issues              |
| `npm run lint:css`      | Run Stylelint                  |
| `npm run typecheck`     | Run TypeScript type checking   |

### Project Structure

```
src/
├── components/       # React components
│   ├── Auth/         # API key input and status
│   ├── Board/        # Kanban board, columns, cards
│   ├── FAQ/          # FAQ modal
│   ├── Filters/      # Filter bar components
│   └── Notifications/# Toast notifications
├── lib/
│   ├── bugzilla/     # Bugzilla API client
│   └── storage/      # Encrypted localStorage
├── store/            # Zustand state management
└── types/            # TypeScript type definitions

api/                  # Vercel serverless functions (CORS proxy)
tests/
└── integration/      # Playwright E2E tests
```

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test -- --watch
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui
```

## Deployment

The app is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Vercel will automatically deploy on every push to `main`

### Environment

No environment variables are required. The app communicates directly with Bugzilla through a CORS proxy serverless function.

## Tech Stack

- **Framework**: [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Icons**: [Google Material Icons](https://fonts.google.com/icons)
- **Testing**: [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev)
- **Linting**: [ESLint](https://eslint.org) + [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)

## Security

- **API Key Storage**: Your Bugzilla API key is encrypted using the Web Crypto API before being stored in localStorage
- **No Server Storage**: The app is entirely client-side. Your API key is only sent directly to Bugzilla
- **CORS Proxy**: The Vercel serverless function only proxies requests to `bugzilla.mozilla.org`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

## License

MIT

## Author

Created by [@jaws](https://github.com/msujaws)
