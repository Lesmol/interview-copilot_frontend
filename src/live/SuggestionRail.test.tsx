import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SuggestionRail from './SuggestionRail'
import type { Suggestion } from './suggestions'

function suggestion(over: Partial<Suggestion>): Suggestion {
  return {
    id: crypto.randomUUID(),
    sessionId: 's1',
    type: 'vague',
    text: 'Which cuts, and how big?',
    quote: 'some cuts',
    sourceSeqs: [2],
    status: 'open',
    createdAt: '2026-11-18T10:00:05Z',
    ...over,
  }
}

describe('SuggestionRail', () => {
  it('shows the type, the suggestion, the quote and the time it came up', () => {
    render(<SuggestionRail items={[suggestion({})]} sessionStartedAt={Date.parse('2026-11-18T10:00:00Z')} onStatus={vi.fn()} />)
    const card = screen.getByTestId('suggestion')
    expect(within(card).getByText('Vague answer')).toBeInTheDocument()
    expect(within(card).getByText('Which cuts, and how big?')).toBeInTheDocument()
    expect(card).toHaveTextContent('“some cuts” · 00:05')
  })

  it('reports Asked, Pin and Dismiss for the right suggestion', async () => {
    const onStatus = vi.fn()
    const item = suggestion({ id: 'a' })
    render(<SuggestionRail items={[item]} onStatus={onStatus} />)
    await userEvent.click(screen.getByRole('button', { name: 'Asked' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pin suggestion' }))
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss suggestion' }))
    expect(onStatus.mock.calls).toEqual([['a', 'asked'], ['a', 'pinned'], ['a', 'dismissed']])
  })

  it('offers Unpin for a pinned card and hides asked and dismissed ones', () => {
    render(
      <SuggestionRail
        items={[
          suggestion({ id: 'p', status: 'pinned', text: 'Pinned one' }),
          suggestion({ id: 'x', status: 'asked', text: 'Asked one' }),
          suggestion({ id: 'd', status: 'dismissed', text: 'Dismissed one' }),
        ]}
        onStatus={vi.fn()}
      />,
    )
    expect(screen.getByText('Pinned one')).toBeInTheDocument()
    expect(screen.queryByText('Asked one')).toBeNull()
    expect(screen.queryByText('Dismissed one')).toBeNull()
    expect(screen.getByRole('button', { name: 'Unpin suggestion' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('suggestion-count')).toHaveTextContent('1 up next · 1 asked')
  })

  it('adds a new card after the existing ones without reordering them or moving focus', async () => {
    const first = suggestion({ id: 'first', text: 'First' })
    const { rerender } = render(<SuggestionRail items={[first]} onStatus={vi.fn()} />)
    const ask = screen.getByRole('button', { name: 'Asked' })
    ask.focus()
    rerender(<SuggestionRail items={[first, suggestion({ id: 'second', text: 'Second' })]} onStatus={vi.fn()} />)
    const texts = screen.getAllByTestId('suggestion').map((c) => c.querySelector('p')?.textContent)
    expect(texts).toEqual(['First', 'Second'].map((t) => t))
    expect(document.activeElement).toBe(ask)
  })

  it('says so when there is nothing to ask', () => {
    render(<SuggestionRail items={[]} onStatus={vi.fn()} />)
    expect(screen.getByText("You're caught up")).toBeInTheDocument()
  })
})
