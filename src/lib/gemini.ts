import { GoogleGenAI, Modality } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TriviaQuestion {
  hostIntro: string;
  question: string;
  options: string[];
  correctAnswer: string;
  hostCorrectFeedback: string;
  hostIncorrectFeedback: string;
}

export async function generateQuestions(topic: string, personality: string): Promise<TriviaQuestion[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 5 trivia questions about ${topic}. The host personality is ${personality}. Include some flavor text from the host for each question.
    
    You MUST return a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
    Each object must have these exact keys:
    - hostIntro: string (Host saying the question in their personality)
    - question: string
    - options: string[] (exactly 4 options)
    - correctAnswer: string
    - hostCorrectFeedback: string (Host's response if the user gets it right)
    - hostIncorrectFeedback: string (Host's response if the user gets it wrong)
    `,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.7,
    }
  });

  let text = response.text;
  if (!text) throw new Error("No response from model");
  
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(text);
}

export async function generateSpeech(text: string, voiceName: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
}

export async function playBase64Audio(base64: string): Promise<void> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  try {
    const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
    return new Promise((resolve) => {
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => resolve();
      source.start(0);
    });
  } catch (e) {
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }
    const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    
    return new Promise((resolve) => {
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => resolve();
      source.start(0);
    });
  }
}
