// Forwards mono microphone audio to the main thread in blocks of ~1024 samples.
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super()
    this.block = new Float32Array(1024)
    this.filled = 0
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (!channel) return true
    let offset = 0
    while (offset < channel.length) {
      const n = Math.min(channel.length - offset, this.block.length - this.filled)
      this.block.set(channel.subarray(offset, offset + n), this.filled)
      this.filled += n
      offset += n
      if (this.filled === this.block.length) {
        this.port.postMessage(this.block.slice())
        this.filled = 0
      }
    }
    return true
  }
}

registerProcessor('pcm-capture', PcmCapture)
