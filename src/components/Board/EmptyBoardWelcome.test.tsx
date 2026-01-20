import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyBoardWelcome } from './EmptyBoardWelcome'

describe('EmptyBoardWelcome', () => {
  describe('rendering', () => {
    it('should render welcome heading', () => {
      render(<EmptyBoardWelcome />)

      expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument()
    })

    it('should render step-by-step instructions', () => {
      render(<EmptyBoardWelcome />)

      // Check for the three main steps
      expect(screen.getByText(/enter your filters/i)).toBeInTheDocument()
      expect(screen.getByText(/drag cards/i)).toBeInTheDocument()
      expect(screen.getByText(/apply changes/i)).toBeInTheDocument()
    })

    it('should have appropriate ARIA role for instructions section', () => {
      render(<EmptyBoardWelcome />)

      expect(screen.getByRole('region', { name: /getting started/i })).toBeInTheDocument()
    })
  })

  describe('instructions content', () => {
    it('should explain how to set filters', () => {
      render(<EmptyBoardWelcome />)

      expect(screen.getByText(/whiteboard tag/i)).toBeInTheDocument()
      expect(screen.getByText(/component/i)).toBeInTheDocument()
    })

    it('should explain how to move bugs between columns', () => {
      render(<EmptyBoardWelcome />)

      expect(
        screen.getByRole('heading', { name: /drag cards between columns/i }),
      ).toBeInTheDocument()
    })

    it('should explain how to save changes', () => {
      render(<EmptyBoardWelcome />)

      expect(screen.getByText(/apply.*button/i)).toBeInTheDocument()
    })
  })

  describe('visual presentation', () => {
    it('should include visual step indicators', () => {
      render(<EmptyBoardWelcome />)

      // Check for numbered steps
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })
})
