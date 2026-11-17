import type { ReactNode } from 'react'

export default function AuthLayout({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-8 px-4 py-8">
      <header className="space-y-3">
        <p className="text-sm tracking-widest text-primary uppercase">Interview Co-Pilot</p>
        <h1 className="font-serif text-4xl leading-tight">{title}</h1>
        {intro && <p className="text-muted-foreground">{intro}</p>}
      </header>
      {children}
    </main>
  )
}

export function Field({ label, hint, ...props }: { label: string; hint?: string } & React.ComponentProps<'input'>) {
  const id = props.id ?? props.name
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}
