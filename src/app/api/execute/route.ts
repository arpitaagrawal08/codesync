import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { script, language, versionIndex } = await request.json();

    const clientId = process.env.NEXT_PUBLIC_JDOODLE_CLIENT_ID || "";
    const clientSecret = process.env.NEXT_PUBLIC_JDOODLE_CLIENT_SECRET || "";

    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script,
        language,
        versionIndex,
        clientId,
        clientSecret,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error executing code via API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
