import { Check, Pin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Suggestion, SuggestionStatus } from './suggestions'

const KINDS: Record<string, { label: string; tone: string }> = {
  follow_up: { label: 'Follow-up', tone: '#E8A33D' },
  vague: { label: 'Vague answer', tone: '#8FB4FF' },
  contradiction: { label: 'Possible contradiction', tone: '#FF8A7A' },
  aside: { label: 'Skipped aside', tone: '#5CC8B8' },
}

function clock(ms: number) {
  const total = Math.floor(ms / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

interface Props {
  items: Suggestion[]
  problem?: string
  sessionStartedAt?: number
  onStatus: (id: string, status: SuggestionStatus) => void
}

/** Open and pinned suggestions only. New cards are appended, so the ones already on screen never move. */
export default function SuggestionRail({ items, problem, sessionStartedAt, onStatus }: Props) {
  const visible = items.filter((s) => s.status === 'open' || s.status === 'pinned')
  const asked = items.filter((s) => s.status === 'asked').length

  return (
    <aside aria-label="Suggestions" className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Suggestions</h2>
        <span className="text-xs text-muted-foreground" aria-live="polite" data-testid="suggestion-count">
          {visible.length} up next · {asked} asked
        </span>
      </div>
      {problem && <p className="text-sm text-muted-foreground">{problem}</p>}

      <div className="flex flex-col gap-3 overflow-y-auto" data-testid="suggestion-list">
        {visible.map((s) => {
          const kind = KINDS[s.type] ?? { label: s.type, tone: '#8B929A' }
          const pinned = s.status === 'pinned'
          const ageMs = sessionStartedAt ? new Date(s.createdAt).getTime() - sessionStartedAt : undefined
          return (
            <article
              key={s.id}
              data-testid="suggestion"
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 motion-safe:animate-in motion-safe:fade-in"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold tracking-wide" style={{ color: kind.tone }}>
                  <span aria-hidden className="size-2 rounded-xs" style={{ background: kind.tone }} />
                  {kind.label}
                </span>
                {pinned && <span className="font-semibold text-primary">Pinned</span>}
              </div>
              <p className="text-base leading-snug font-medium">{s.text}</p>
              {(s.quote || ageMs !== undefined) && (
                <p className="text-sm text-muted-foreground">
                  {s.quote && <>“{s.quote}”</>}
                  {s.quote && ageMs !== undefined && ' · '}
                  {ageMs !== undefined && ageMs >= 0 && clock(ageMs)}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" className="min-h-11 gap-2 px-4" onClick={() => onStatus(s.id, 'asked')}>
                  <Check aria-hidden className="size-4" />
                  Asked
                </Button>
                <Button
                  variant="outline"
                  className="size-11"
                  aria-label={pinned ? 'Unpin suggestion' : 'Pin suggestion'}
                  aria-pressed={pinned}
                  onClick={() => onStatus(s.id, pinned ? 'open' : 'pinned')}
                >
                  <Pin aria-hidden className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-11"
                  aria-label="Dismiss suggestion"
                  onClick={() => onStatus(s.id, 'dismissed')}
                >
                  <X aria-hidden className="size-4" />
                </Button>
              </div>
            </article>
          )
        })}
        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="font-medium">You're caught up</p>
            <p className="text-sm text-muted-foreground">New suggestions show up here as the conversation moves.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
