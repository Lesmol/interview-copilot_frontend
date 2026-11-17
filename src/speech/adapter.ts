export interface FinalUtterance {
  text: string
  startMs: number
  endMs: number
}

/** Everything above this interface is provider-agnostic. */
export interface SpeechAdapter {
  connect(token: string): Promise<void>
  /** One 16 kHz mono 16-bit PCM frame (about 50 ms). */
  sendAudio(frame: Int16Array<ArrayBuffer>): void
  onPartial(handler: (text: string) => void): void
  onFinal(handler: (utterance: FinalUtterance) => void): void
  onUtteranceEnd(handler: () => void): void
  onError(handler: (message: string) => void): void
  close(): void
}
