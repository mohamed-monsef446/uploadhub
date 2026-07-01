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
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>

<body style="margin:0;padding:40px;background:#f6f6f6;font-family:Arial">

<div style="max-width:600px;margin:auto;background:white;border-radius:18px;padding:35px">

<h2 style="margin-top:0">
📁 Files shared with you
</h2>

<p>
<b>${fromEmail}</b> shared files with you using UploadHub.
</p>

<p>
This transfer expires in
<b>${expiresIn}</b>.
</p>

<p style="margin:35px 0">

<a
href="${link}"
style="
background:#2563eb;
color:white;
padding:15px 25px;
text-decoration:none;
border-radius:12px;
display:inline-block;
font-weight:bold;
">

Open Files

</a>

</p>

<p style="font-size:13px;color:#666;word-break:break-all">
${link}
</p>

<hr>

<p style="font-size:12px;color:#999">

Powered by UploadHub

</p>

</div>

</body>

</html>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Email provider failed",
          error: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Email failed",
      },
      { status: 500 }
    );
  }
}