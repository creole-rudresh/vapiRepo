# VAPI + Anam.ai — AI Voice Agent with Avatar Demo

A demo project showcasing the integration of **VAPI voice AI agent** with **Anam.ai real-time avatar** for lifelike conversational AI experiences.

## 🏗️ Architecture

This project demonstrates how to replace the Trulience avatar (used in the main `doctorAssistantAgent` project) with Anam.ai's avatar technology.

### Integration Flow

```
┌──────────────┐     Audio/WebRTC      ┌──────────────┐
│              │ ◄────────────────────► │              │
│   User's     │     STT → LLM → TTS   │    VAPI      │
│   Browser    │                        │   (Voice)    │
│              │                        │              │
└──────┬───────┘                        └──────┬───────┘
       │                                       │
       │  Video (WebRTC)                       │ Transcript events
       │                                       │
┌──────▼───────┐                        ┌──────▼───────┐
│              │ ◄──── talk(text) ──────│              │
│   Anam.ai    │                        │  CallScreen  │
│   Avatar     │     lip-sync driven    │  Component   │
│   (Visual)   │     by VAPI text       │              │
└──────────────┘                        └──────────────┘
```

### How It Works

1. **VAPI** handles all voice intelligence:
   - Speech-to-Text (STT) — converts user's speech to text
   - LLM — processes the conversation and generates responses
   - Text-to-Speech (TTS) — converts AI responses to spoken audio
   - Audio is streamed via Daily.co WebRTC

2. **Anam.ai** handles the avatar visualization:
   - Creates a photorealistic avatar via WebRTC video stream
   - Receives transcript text via `anamClient.talk(text)`
   - Lip-syncs the avatar to match the conversation
   - `disableInputAudio: true` — VAPI handles mic input, not Anam
   - `disableOutputAudio: true` — VAPI handles audio playback, not Anam

3. **The Bridge** — `CallScreen.tsx`:
   - Listens to VAPI's `transcript` events
   - Forwards assistant text to Anam's `talk()` command
   - Manages call lifecycle (start, mute, end)

## 🆚 Comparison: Trulience vs Anam.ai

| Feature | doctorAssistantAgent (Trulience) | vapi-anam-demo (Anam.ai) |
|---------|----------------------------------|--------------------------|
| Avatar SDK | `@trulience/react-sdk` | `@anam-ai/js-sdk` |
| Audio Bridge | `setMediaStream(stream)` — passes Daily audio stream | `talk(text)` — passes transcript text |
| Lip-sync Method | `processSSML({ text }, "chunk")` | `talk(transcriptText)` |
| Avatar Type | 3D rendered avatar | Photorealistic AI-generated |
| Connection | WebSocket + Agora | WebRTC native |
| React Integration | `<TrulienceAvatar>` component | `anamClient.streamToVideoElement()` |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A **VAPI** account with API key + Assistant ID
- An **Anam.ai** account with API key

### Setup

1. **Install dependencies:**
   ```bash
   cd /var/www/html/DoctorAgent/vapi-anam-demo
   npm install
   ```

2. **Configure environment:**
   Edit `.env.local` with your actual API keys:
   ```env
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key
   NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-vapi-assistant-id
   ANAM_API_KEY=your-anam-api-key
   NEXT_PUBLIC_ANAM_AVATAR_ID=your-avatar-id
   NEXT_PUBLIC_ANAM_VOICE_ID=your-voice-id
   NEXT_PUBLIC_ANAM_LLM_ID=your-llm-id
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Test the flow:**
   - Click "Start Conversation"
   - Allow microphone access
   - Speak to the AI agent
   - Watch the avatar lip-sync in real-time!

## 📁 Project Structure

```
vapi-anam-demo/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── anam-token/
│   │   │       └── route.ts      # Server-side Anam session token generation
│   │   ├── globals.css            # Premium dark theme design system
│   │   ├── layout.tsx             # Root layout with ambient effects
│   │   └── page.tsx               # Page state router
│   └── components/
│       ├── CallScreen.tsx         # Core VAPI + Anam integration
│       └── WelcomeLanding.tsx     # Landing page UI
├── .env.local                     # API keys (gitignored)
├── package.json
└── README.md
```

## 🔑 Key API References

- **VAPI Docs:** https://docs.vapi.ai
- **Anam.ai Docs:** https://docs.anam.ai
- **Anam.ai SDK:** https://www.npmjs.com/package/@anam-ai/js-sdk

## 📝 Notes

- The Anam API key is kept server-side in the `/api/anam-token` route for security
- Session tokens are short-lived and safe to pass to the client
- VAPI's Daily.co handles all WebRTC audio transport
- Anam avatar renders as a standard `<video>` element
