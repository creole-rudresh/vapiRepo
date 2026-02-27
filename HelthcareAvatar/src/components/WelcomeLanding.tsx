"use client";

import { Sparkles, ArrowRight, Mic, Video, Zap } from "lucide-react";

interface WelcomeLandingProps {
    onStartCall: () => void;
}

export default function WelcomeLanding({ onStartCall }: WelcomeLandingProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
            {/* Logo Header */}
            <div className="absolute top-6 left-8 flex items-center gap-2.5">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                        background:
                            "linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-mid))",
                    }}
                >
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
                    VAPI<span className="text-gradient">×Anam</span>
                </span>
            </div>

            {/* Hero Content */}
            <div className="text-center max-w-2xl mx-auto space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent-soft)] border border-[rgba(99,102,241,0.2)]">
                    <Zap className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span className="text-xs font-medium text-[var(--color-gradient-end)]">
                        AI Voice Agent + Avatar Demo
                    </span>
                </div>

                {/* Title */}
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                    Talk to an{" "}
                    <span className="text-gradient">AI Agent</span>
                    <br />
                    with a{" "}
                    <span className="text-gradient">Living Avatar</span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
                    Experience next-gen AI conversation powered by{" "}
                    <strong className="text-[var(--color-text-primary)]">VAPI</strong> voice intelligence
                    and <strong className="text-[var(--color-text-primary)]">Anam.ai</strong> lifelike
                    avatars — all in real-time.
                </p>

                {/* CTA Button */}
                <div className="pt-4">
                    <button
                        id="start-call-btn"
                        className="btn-primary text-base px-8 py-3.5"
                        onClick={onStartCall}
                    >
                        Start Conversation
                        <ArrowRight className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto w-full px-4">
                <div className="glass-card p-5 text-center space-y-3">
                    <div
                        className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center"
                        style={{
                            background: "var(--color-accent-soft)",
                            border: "1px solid rgba(99,102,241,0.15)",
                        }}
                    >
                        <Mic className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <h3 className="font-display font-semibold text-sm">
                        VAPI Voice Agent
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        Natural conversation powered by advanced STT, LLM, and TTS pipeline
                    </p>
                </div>

                <div className="glass-card p-5 text-center space-y-3">
                    <div
                        className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center"
                        style={{
                            background: "rgba(139,92,246,0.1)",
                            border: "1px solid rgba(139,92,246,0.15)",
                        }}
                    >
                        <Video className="w-5 h-5 text-[var(--color-gradient-mid)]" />
                    </div>
                    <h3 className="font-display font-semibold text-sm">
                        Anam.ai Avatar
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        Real-time photorealistic avatar with lip-sync via WebRTC streaming
                    </p>
                </div>

                <div className="glass-card p-5 text-center space-y-3">
                    <div
                        className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center"
                        style={{
                            background: "rgba(34,197,94,0.08)",
                            border: "1px solid rgba(34,197,94,0.15)",
                        }}
                    >
                        <Zap className="w-5 h-5 text-[var(--color-success)]" />
                    </div>
                    <h3 className="font-display font-semibold text-sm">
                        Low Latency
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        Sub-second response times with real-time audio streaming and
                        rendering
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-center">
                <p className="text-xs text-[var(--color-text-muted)]">
                    Demo by Sapahk · Powered by VAPI + Anam.ai
                </p>
            </div>
        </div>
    );
}
