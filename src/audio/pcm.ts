export const TARGET_RATE = 16_000
/** 50 ms of 16 kHz mono audio. */
export const FRAME_SAMPLES = 800

/** Resamples float audio to 16 kHz mono and cuts it into 16-bit PCM frames of 50 ms. */
export class PcmFramer {
  private pending: number[] = []
  /** Read position into `pending`, in input samples (fractional for linear interpolation). */
  private position = 0
  private out: number[] = []
  private readonly step: number

  private readonly onFrame: (frame: Int16Array<ArrayBuffer>) => void

  constructor(inputRate: number, onFrame: (frame: Int16Array<ArrayBuffer>) => void) {
    this.step = inputRate / TARGET_RATE
    this.onFrame = onFrame
  }

  push(samples: Float32Array): void {
    for (const s of samples) this.pending.push(s)
    while (this.position + 1 < this.pending.length) {
      const i = Math.floor(this.position)
      const frac = this.position - i
      this.out.push(this.pending[i] * (1 - frac) + this.pending[i + 1] * frac)
      this.position += this.step
      if (this.out.length === FRAME_SAMPLES) {
        this.onFrame(toInt16(this.out))
        this.out = []
      }
    }
    const consumed = Math.floor(this.position)
    if (consumed > 0) {
      this.pending = this.pending.slice(consumed)
      this.position -= consumed
    }
  }
}

export function toInt16(samples: ArrayLike<number>): Int16Array<ArrayBuffer> {
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return pcm
}
