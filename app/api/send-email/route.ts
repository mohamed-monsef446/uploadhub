import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      to,
      fromEmail,
      link,
      expiresIn = "3 days",
      title = "Files shared with you",
    } = body;

    if (!to || !fromEmail || !link) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "RESEND_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "UploadHub <onboarding@resend.dev>",
        to,
        reply_to: fromEmail,
        subject: title,
        html: `
          <div style="font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:auto">
              <h2>📁 Files shared with you</h2>

              <p><strong>${fromEmail}</strong> shared files with you using UploadHub.</p>

              <p>This transfer expires in <strong>${expiresIn}</strong>.</p>

              <p style="margin:35px 0">
                  <a href="${link}"
                     style="
                        background:#2563eb;
                        color:white;
                        padding:14px 22px;
                        text-decoration:none;
                        border-radius:12px;
                        font-weight:bold;
                        display:inline-block;">
                      Open Files
                  </a>
              </p>

              <p style="font-size:13px;color:#666">
                  ${link}
              </p>

              <hr>

              <p style="font-size:12px;color:#999">
                  Powered by UploadHub
              </p>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 }
    );
  }
}