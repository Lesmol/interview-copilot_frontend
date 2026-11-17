/** Reads the human message from a Problem Details body ({ detail }), or falls back. */
export function problemMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'detail' in error && typeof error.detail === 'string' && error.detail) {
    return error.detail
  }
  return fallback
}
