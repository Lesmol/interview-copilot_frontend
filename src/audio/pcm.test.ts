import { describe, expect, it } from 'vitest'
import { FRAME_SAMPLES, PcmFramer, toInt16 } from './pcm'

describe('toInt16', () => {
  it('scales and clamps', () => {
    expect(Array.from(toInt16([0, 1, -1, 2, -2]))).toEqual([0, 32767, -32768, 32767, -32768])
  })
})

describe('PcmFramer', () => {
  it('emits 800-sample frames (50 ms at 16 kHz) from 48 kHz input', () => {
    const frames: Int16Array[] = []
    const framer = new PcmFramer(48_000, (f) => frames.push(f))
    // 100 ms of 48 kHz audio = 4800 samples -> ~1600 samples at 16 kHz -> 2 frames.
    framer.push(new Float32Array(4_800).fill(0.5))
    framer.push(new Float32Array(48).fill(0.5))
    expect(frames).toHaveLength(2)
    expect(frames.every((f) => f.length === FRAME_SAMPLES)).toBe(true)
    expect(frames[0][100]).toBe(Math.trunc(0.5 * 0x7fff))
  })

  it('passes 16 kHz input through unchanged in length', () => {
    const frames: Int16Array[] = []
    const framer = new PcmFramer(16_000, (f) => frames.push(f))
    framer.push(new Float32Array(1_601))
    expect(frames).toHaveLength(2)
  })

  it('keeps timing across many small pushes', () => {
    let count = 0
    const framer = new PcmFramer(44_100, () => count++)
    for (let i = 0; i < 345; i++) framer.push(new Float32Array(128)) // ~1.0 s
    expect(count).toBeGreaterThanOrEqual(19)
    expect(count).toBeLessThanOrEqual(20)
  })
})
