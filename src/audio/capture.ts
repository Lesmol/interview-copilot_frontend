import { PcmFramer } from './pcm'

export interface MicCapture {
  stop(): void
}

/** Captures the microphone as 16 kHz mono 16-bit PCM frames of about 50 ms. */
export async function startMicCapture(
  onFrame: (frame: Int16Array<ArrayBuffer>) => void,
  deviceId?: string,
): Promise<MicCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: deviceId ? { exact: deviceId } : undefined, channelCount: 1, echoCancellation: true, noiseSuppression: true },
  })
  const context = new AudioContext({ latencyHint: 'interactive' })
  await context.audioWorklet.addModule('/pcm-capture-worklet.js')
  const source = context.createMediaStreamSource(stream)
  const node = new AudioWorkletNode(context, 'pcm-capture', { numberOfInputs: 1, numberOfOutputs: 0 })
  const framer = new PcmFramer(context.sampleRate, onFrame)
  node.port.onmessage = (event: MessageEvent<Float32Array>) => framer.push(event.data)
  source.connect(node)

  return {
    stop() {
      node.port.onmessage = null
      source.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      void context.close()
    },
  }
}
