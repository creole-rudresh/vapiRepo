import { NextResponse } from "next/server";

/**
 * Server-side API route to generate an Anam.ai session token.
 * This keeps the ANAM_API_KEY secret on the server side.
 *
 * The session token is short-lived and safe to pass to the client.
 */
export async function POST() {
    const apiKey = process.env.ANAM_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "Missing ANAM_API_KEY in server environment" },
            { status: 500 }
        );
    }

    try {
        const personaConfig = {
            personaId: "vapi_persona",
            name: "Liv",
            avatarId:
                process.env.NEXT_PUBLIC_ANAM_AVATAR_ID ||
                "30fa96d0-26c4-4e55-94a0-517025942e18",
            voiceId:
                process.env.NEXT_PUBLIC_ANAM_VOICE_ID ||
                "6bfbe25a-979d-40f3-a92b-5394170af54b",
            llmId: "CUSTOMER_CLIENT_V1",
            maxSessionLengthSeconds: 900,
        };

        console.log("Creating Anam session with config:", JSON.stringify(personaConfig, null, 2));

        const response = await fetch("https://api.anam.ai/v1/auth/session-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ personaConfig }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Anam token API error:", response.status, errorText);
            return NextResponse.json(
                { error: `Anam API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log("✅ Anam session token created successfully");
        return NextResponse.json({ sessionToken: data.sessionToken });
    } catch (error) {
        console.error("Error generating Anam session token:", error);
        return NextResponse.json(
            { error: "Failed to generate session token" },
            { status: 500 }
        );
    }
}
