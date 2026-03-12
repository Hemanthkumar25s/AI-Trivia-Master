import { GoogleGenAI, Modality } from "@google/genai";

let liveAudioCtx: AudioContext | null = null;

export class LiveSession {
  private sessionPromise: Promise<any> | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private nextPlayTime = 0;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;

  constructor(
    private personality: string,
    private topic: string,
    private voiceName: string,
    private onMessage: (msg: string) => void,
    private onError: (err: any) => void,
    private onInterrupted: () => void
  ) {}

  async connect() {
    if (!liveAudioCtx) {
      liveAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (liveAudioCtx.state === 'suspended') {
      await liveAudioCtx.resume();
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = liveAudioCtx.createMediaStreamSource(this.stream);
    this.processor = liveAudioCtx.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.sessionPromise) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        let s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      const buffer = new ArrayBuffer(pcm16.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < pcm16.length; i++) {
        view.setInt16(i * 2, pcm16[i], true);
      }
      
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = window.btoa(binary);

      this.sessionPromise.then(session => {
        session.sendRealtimeInput([{
          mimeType: 'audio/pcm;rate=16000',
          data: base64Data
        }]);
      }).catch(console.error);
    };

    this.source.connect(this.processor);
    this.processor.connect(liveAudioCtx.destination);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    this.sessionPromise = ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voiceName } },
        },
        systemInstruction: `You are a trivia game host with the following personality: ${this.personality}. The user is currently playing a trivia game about ${this.topic}. You can help them, encourage them, or just chat. Keep your responses brief and engaging. CRITICAL: Always remain polite, friendly, and supportive. Never be rude or insulting.`,
      },
      callbacks: {
        onopen: () => {
          console.log("Live API connected");
        },
        onmessage: (message: any) => {
          if (message.serverContent?.interrupted) {
            this.audioQueue = [];
            this.onInterrupted();
          }
          
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            this.playPcmAudio(base64Audio);
          }
        },
        onerror: (err: any) => {
          console.error("Live API error:", err);
          this.onError(err);
        },
        onclose: () => {
          console.log("Live API closed");
        }
      }
    });
  }

  private async playPcmAudio(base64: string) {
    if (!liveAudioCtx) return;
    
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }
    
    const audioBuffer = liveAudioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    
    this.audioQueue.push(audioBuffer);
    this.scheduleNextAudio();
  }

  private scheduleNextAudio() {
    if (this.isPlaying || this.audioQueue.length === 0 || !liveAudioCtx) return;
    
    this.isPlaying = true;
    const buffer = this.audioQueue.shift()!;
    
    const source = liveAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(liveAudioCtx.destination);
    
    const currentTime = liveAudioCtx.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    
    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
    
    source.onended = () => {
      this.isPlaying = false;
      this.scheduleNextAudio();
    };
  }

  disconnect() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close()).catch(console.error);
      this.sessionPromise = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }
}
