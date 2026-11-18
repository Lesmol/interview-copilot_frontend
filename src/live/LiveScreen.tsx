import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import SuggestionRail from "./SuggestionRail";
import { useLiveTranscript } from "./useLiveTranscript";
import { useSuggestions } from "./useSuggestions";

function clock(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function LiveScreen() {
  const { status, error, lines, partial, sessionId, startedAt, start, stop } =
    useLiveTranscript();
  const suggestions = useSuggestions(sessionId);
  const scroller = useRef<HTMLDivElement>(null);
  const pinnedToEnd = useRef(true);

  // Follow new text only while the reader is at the end; never fight their scrolling.
  useEffect(() => {
    const el = scroller.current;
    if (el && pinnedToEnd.current) el.scrollTop = el.scrollHeight;
  }, [lines, partial]);

  const live = status === "live";

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <p
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <span
            className={`size-2.5 rounded-full ${live ? "bg-live motion-safe:animate-pulse" : "bg-input"}`}
            aria-hidden
          />
          {status === "connecting"
            ? "Connecting…"
            : live
              ? "Listening"
              : "Not recording"}
        </p>
        {live ? (
          <Button variant="secondary" onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button
            onClick={() => void start()}
            disabled={status === "connecting"}
          >
            Start live transcript
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div
          ref={scroller}
          data-testid="transcript"
          onScroll={(e) => {
            const el = e.currentTarget;
            pinnedToEnd.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          }}
          className="min-h-64 flex-1 overflow-y-auto rounded-lg border bg-card p-4 font-serif text-xl leading-relaxed"
        >
          {lines.length === 0 && !partial && (
            <p className="text-muted-foreground">
              Words appear here as they are spoken.
            </p>
          )}
          {lines.map((line) => (
            <p key={line.id} className="mb-3">
              <span className="mr-3 font-sans text-xs text-muted-foreground tabular-nums">
                {clock(line.startMs)}
              </span>
              {line.text}
            </p>
          ))}
          {partial && (
            <p className="text-muted-foreground" data-testid="partial">
              {partial}
              <span
                className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 bg-primary motion-safe:animate-pulse"
                aria-hidden
              />
            </p>
          )}
        </div>
        <SuggestionRail
          items={suggestions.items}
          problem={suggestions.problem}
          sessionStartedAt={startedAt}
          onStatus={(id, next) => void suggestions.setStatus(id, next)}
        />
      </div>
    </section>
  );
}
