"use client";

import {
    useRef,
    useState,
    useEffect,
    useCallback,
} from "react";
import Vapi from "@vapi-ai/web";
import { createClient, AnamEvent } from "@anam-ai/js-sdk";
import {
    ArrowLeft,
    Mic,
    MicOff,
    PhoneOff,
    Volume2,
    VolumeX,
    Sparkles,
    MessageSquare,
    X,
} from "lucide-react";

// ─── Types ───
enum CallStatus {
    IDLE = "idle",
    CONNECTING = "connecting",
    ACTIVE = "active",
    SPEAKING = "speaking",
    LISTENING = "listening",
    ENDED = "ended",
}

interface Message {
    role: "assistant" | "user";
    content: string;
    timestamp: string;
}

interface CallScreenProps {
    onBack: () => void;
}

// ─── Helpers ───
function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Component ───
export default function CallScreen({ onBack }: CallScreenProps) {
    // State
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.IDLE);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [anamReady, setAnamReady] = useState(false);

    // Refs
    const vapiRef = useRef<Vapi | null>(null);
    const anamClientRef = useRef<ReturnType<typeof createClient> | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mobileMessagesEndRef = useRef<HTMLDivElement>(null);

    const isCallActive =
        callStatus === CallStatus.ACTIVE ||
        callStatus === CallStatus.SPEAKING ||
        callStatus === CallStatus.LISTENING;

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        mobileMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            vapiRef.current?.stop();
            anamClientRef.current?.stopStreaming();
        };
    }, []);

    // ─── Initialize Anam Avatar ───
    const initAnamAvatar = useCallback(async () => {
        try {
            // Get session token from our server-side API
            console.log("🔄 Requesting Anam session token...");
            const tokenRes = await fetch("/api/anam-token", { method: "POST" });
            const tokenData = await tokenRes.json();

            if (!tokenRes.ok || !tokenData.sessionToken) {
                console.error("❌ Failed to get Anam session token:", tokenData);
                return null;
            }
            console.log("✅ Got Anam session token");

            // Create Anam client with session token
            // disableInputAudio: VAPI handles mic, not Anam
            // Video element is muted so Anam's audio output is silenced
            const anamClient = createClient(tokenData.sessionToken, {
                disableInputAudio: true,
            });

            anamClientRef.current = anamClient;

            // Listen for connection events
            anamClient.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
                console.log("✅ Anam WebRTC connection established");
            });

            anamClient.addListener(AnamEvent.CONNECTION_CLOSED, (reason: unknown) => {
                console.log("⚠️ Anam connection closed:", reason);
            });

            anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
                console.log("✅ Anam video playback started");
                setAnamReady(true);
            });

            // Stream avatar video to our video element
            if (videoRef.current) {
                console.log("🔄 Starting Anam stream to video element:", videoRef.current.id);
                await anamClient.streamToVideoElement(videoRef.current.id);
                setAnamReady(true);
                console.log("✅ Anam avatar connected and streaming");
            }

            return anamClient;
        } catch (error) {
            console.error("❌ Error initializing Anam avatar:", error);
            if (error instanceof Error) {
                console.error("Error name:", error.name);
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
            return null;
        }
    }, []);

    // ─── Start the Call ───
    const startCall = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);
        setMessages([]);
        setCallStatus(CallStatus.CONNECTING);

        try {
            // 1. Initialize Anam Avatar first
            const anamClient = await initAnamAvatar();

            // 2. Initialize VAPI
            const vapiInstance = new Vapi(
                process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY as string
            );
            vapiRef.current = vapiInstance;

            // 3. Set up VAPI event listeners
            vapiInstance.on("call-start", () => {
                setCallStatus(CallStatus.ACTIVE);
                setIsLoading(false);
                console.log("✅ VAPI call started");
            });

            // Ref for Anam Talk Stream
            let currentTalkStream: any = null;

            vapiInstance.on("speech-start", () => {
                setCallStatus(CallStatus.SPEAKING);
                if (anamClientRef.current) {
                    try {
                        currentTalkStream = anamClientRef.current.createTalkMessageStream();
                    } catch (e) {
                        console.error("Failed to create Anam talk stream:", e);
                    }
                }
            });

            vapiInstance.on("speech-end", async () => {
                setCallStatus(CallStatus.LISTENING);
                if (currentTalkStream) {
                    try {
                        await currentTalkStream.endMessage();
                    } catch (e) {
                        console.error("Failed to end Anam talk stream:", e);
                    }
                    currentTalkStream = null;
                }
            });

            vapiInstance.on("call-end", () => {
                handleCallEnd();
            });

            vapiInstance.on("error", (e) => {
                console.error("VAPI error:", e);
                handleCallEnd();
            });

            // Handle messages
            vapiInstance.on("message", async (message: Record<string, unknown>) => {

                // Stream raw LLM chunks to Anam for near-zero latency lip sync
                if (
                    message.type === "model-output" &&
                    anamClientRef.current &&
                    typeof message.output === "string" &&
                    message.output.trim() !== ""
                ) {
                    if (!currentTalkStream) {
                        currentTalkStream = anamClientRef.current.createTalkMessageStream();
                    }
                    try {
                        await currentTalkStream.streamMessageChunk(message.output, false);
                    } catch (err) {
                        console.error("Error streaming chunk to Anam:", err);
                    }
                }

                // Handle conversation updates for the chat panel
                if (
                    message.type === "conversation-update" &&
                    Array.isArray(message.conversation)
                ) {
                    const validMessages = (message.conversation as Array<{ role: string; content: string }>)
                        .filter(
                            (msg) => msg.role === "assistant" || msg.role === "user"
                        )
                        .map((msg) => ({
                            role: msg.role as "assistant" | "user",
                            content: msg.content,
                            timestamp: new Date().toISOString(),
                        }));

                    setMessages(validMessages);
                }
            });

            // 4. Start VAPI call with the assistant
            await vapiInstance.start(
                process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID as string,
                {
                    firstMessage: "Hello Soham, I am Alex, your personal Doctor's AI Assistant. To prepare your visit with the doctor, I'm going to ask you a series of questions about your health. Please answer as best you can. The session will be about five to seven minutes, and we would like to cover some General Updates, Vitals, About your Diet and Nutrition, Some Lifestyle & General Symptoms, and Some Diabetes Complication Review questions. Are you ready to start?",
                    variableValues: {
                        name: "Soham",
                        doctor_name: "Johnson"
                    }
                }
            );

            // 5. Set up Daily audio stream → route to Anam if needed
            setupDailyAudio(vapiInstance);
        } catch (error) {
            console.error("Error starting call:", error);
            setIsLoading(false);
            setCallStatus(CallStatus.IDLE);
        }
    }, [isLoading, initAnamAvatar]);

    // ─── Setup Daily.co Audio ───
    const setupDailyAudio = (vapiInstance: Vapi) => {
        const checkDaily = () => {
            const dailyCall = vapiInstance.getDailyCallObject();
            if (dailyCall) {
                dailyCall.on("track-started", (event) => {
                    if (
                        event.participant &&
                        !event.participant.local &&
                        event.track.kind === "audio"
                    ) {
                        console.log("✅ Received audio track from VAPI Daily.co");

                        // Mute Vapi's audio player so we don't get double audio. 
                        // Anam will play the generated audio perfectly synced with its video.
                        setTimeout(() => {
                            const vapiAudioPlayer = document.querySelector(
                                `audio[data-participant-id="${event.participant!.session_id}"]`
                            ) as HTMLAudioElement;
                            if (vapiAudioPlayer) {
                                vapiAudioPlayer.muted = true;
                                console.log("🔇 Muted VAPI audio player to prevent double audio");
                            }
                        }, 100);
                    }
                });
            } else {
                setTimeout(checkDaily, 100);
            }
        };
        checkDaily();
    };

    // ─── End Call ───
    const handleCallEnd = useCallback(() => {
        vapiRef.current?.stop();

        // Stop Anam streaming
        try {
            anamClientRef.current?.stopStreaming();
        } catch (e) {
            console.error("Error stopping Anam stream:", e);
        }

        setIsMuted(false);
        setIsSpeakerMuted(false);
        setCallStatus(CallStatus.ENDED);
        setShowThankYou(true);
        setShowTranscript(false);
        setAnamReady(false);
        setIsLoading(false);

        setTimeout(() => {
            setShowThankYou(false);
            setMessages([]);
            setCallStatus(CallStatus.IDLE);
        }, 5000);
    }, []);

    // ─── Controls ───
    const toggleMute = () => {
        if (vapiRef.current) {
            vapiRef.current.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleSpeaker = () => {
        // Toggle VAPI audio output
        setIsSpeakerMuted(!isSpeakerMuted);
        // Mute/unmute the Daily audio
        const daily = vapiRef.current?.getDailyCallObject();
        if (daily) {
            daily.setLocalAudio(!isSpeakerMuted);
        }
    };

    // ─── Status Label ───
    const getStatusLabel = () => {
        switch (callStatus) {
            case CallStatus.CONNECTING:
                return { text: "Connecting...", variant: "connecting" };
            case CallStatus.ACTIVE:
            case CallStatus.LISTENING:
                return { text: "Listening", variant: "active" };
            case CallStatus.SPEAKING:
                return { text: "Speaking", variant: "active" };
            case CallStatus.ENDED:
                return { text: "Call Ended", variant: "idle" };
            default:
                return { text: "Ready", variant: "idle" };
        }
    };

    const status = getStatusLabel();

    // ─── Render ───
    return (
        <div className="min-h-screen flex flex-col relative z-10">
            {/* ── Header ── */}
            <header className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <button
                        id="back-btn"
                        onClick={onBack}
                        className="btn-ghost w-9 h-9"
                        title="Back"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                                background:
                                    "linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-mid))",
                            }}
                        >
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-display text-base font-semibold tracking-tight">
                            VAPI<span className="text-gradient">×Anam</span>
                        </span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`status-badge ${status.variant}`}>
                    <span className={`pulse-dot ${status.variant}`} />
                    {status.text}
                </div>
            </header>

            {/* ── Main Layout ── */}
            <main className="flex-1 flex flex-col lg:flex-row gap-6 px-6 pb-6">
                {/* Left Side: Avatar */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    {/* Avatar Container */}
                    <div
                        className={`avatar-container ${isCallActive ? "active" : ""}`}
                    >
                        <div className="avatar-glow" />
                        <video
                            id="anam-avatar-video"
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{
                                display: anamReady ? "block" : "none",
                            }}
                        />
                        {/* Idle/Loading State */}
                        {!anamReady && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center"
                                    style={{
                                        background: "var(--color-accent-soft)",
                                        border: "2px solid rgba(99,102,241,0.2)",
                                    }}
                                >
                                    {isLoading ? (
                                        <div className="spinner" />
                                    ) : (
                                        <Sparkles className="w-8 h-8 text-[var(--color-accent)]" />
                                    )}
                                </div>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {isLoading
                                        ? "Connecting avatar..."
                                        : "Avatar will appear here"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Waveform (during active call) */}
                    {callStatus === CallStatus.SPEAKING && (
                        <div className="waveform mt-6">
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                        </div>
                    )}

                    {/* Thank You Message */}
                    {showThankYou && (
                        <div className="text-center mt-8 max-w-md space-y-3">
                            <h2 className="font-display text-2xl font-bold text-gradient">
                                Thank You!
                            </h2>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                The conversation has ended. You can start a new one anytime.
                            </p>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center gap-4 mt-8">
                        {callStatus === CallStatus.IDLE && !showThankYou && (
                            <button
                                id="start-call-btn"
                                className="btn-primary text-base px-10 py-3.5"
                                onClick={startCall}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-5 h-5" />
                                        Start Call
                                    </>
                                )}
                            </button>
                        )}

                        {isCallActive && (
                            <>
                                {/* Mobile Transcript Toggle */}
                                <button
                                    id="transcript-toggle-btn"
                                    className="btn-ghost w-11 h-11 lg:hidden"
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    title="Toggle Transcript"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </button>

                                {/* Mute Mic */}
                                <button
                                    id="mute-btn"
                                    className={`btn-ghost w-11 h-11 ${isMuted ? "active" : ""}`}
                                    onClick={toggleMute}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? (
                                        <MicOff className="w-5 h-5" />
                                    ) : (
                                        <Mic className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Mute Speaker */}
                                <button
                                    id="speaker-btn"
                                    className={`btn-ghost w-11 h-11 ${isSpeakerMuted ? "active" : ""
                                        }`}
                                    onClick={toggleSpeaker}
                                    title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
                                >
                                    {isSpeakerMuted ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>

                                {/* End Call */}
                                <button
                                    id="end-call-btn"
                                    className="btn-danger w-11 h-11"
                                    onClick={handleCallEnd}
                                    title="End Call"
                                >
                                    <PhoneOff className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side: Chat Panel (Desktop) */}
                {!showThankYou && (
                    <div className="hidden lg:flex w-[380px] flex-col chat-panel">
                        {/* Chat Header */}
                        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--color-border)]">
                            <MessageSquare className="w-4 h-4 text-[var(--color-text-muted)]" />
                            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                Transcript
                            </span>
                            {messages.length > 0 && (
                                <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                                    {messages.length} messages
                                </span>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-h-[calc(100vh-200px)]">
                            {messages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-xs text-[var(--color-text-muted)] text-center">
                                        Conversation transcript will appear here once the call
                                        starts.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"
                                            }`}
                                    >
                                        <div className={`chat-message ${msg.role}`}>
                                            {msg.content}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 px-1">
                                            <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                                                {msg.role === "assistant" ? "AI Agent" : "You"}
                                            </span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                                {formatTime(msg.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}
            </main>

            {/* ── Mobile Transcript Overlay ── */}
            {showTranscript && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
                    <div
                        className="w-full rounded-t-2xl flex flex-col max-h-[80vh]"
                        style={{
                            background: "var(--color-bg-elevated)",
                            borderTop: "1px solid var(--color-border)",
                        }}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                    Transcript
                                </span>
                            </div>
                            <button
                                onClick={() => setShowTranscript(false)}
                                className="btn-ghost w-8 h-8"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"
                                        }`}
                                >
                                    <div className={`chat-message ${msg.role}`}>
                                        {msg.content}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 px-1">
                                        <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                                            {msg.role === "assistant" ? "AI Agent" : "You"}
                                        </span>
                                        <span className="text-[10px] text-[var(--color-text-muted)]">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={mobileMessagesEndRef} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
