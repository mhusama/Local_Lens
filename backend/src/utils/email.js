import nodemailer from "nodemailer";

function getSmtpConfig() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return null;
    return {
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    };
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@locallens.local";
    const subject = "Reset your Local Lens password";
    const text = [
        "You requested a password reset for your Local Lens account.",
        "",
        "Open this link to choose a new password (expires in 1 hour):",
        resetUrl,
        "",
        "If you did not request this, you can ignore this email.",
    ].join("\n");

    const html = `
        <p>You requested a password reset for your <strong>Local Lens</strong> account.</p>
        <p><a href="${resetUrl}">Reset your password</a> (link expires in 1 hour).</p>
        <p>If you did not request this, you can ignore this email.</p>
    `;

    const smtp = getSmtpConfig();
    if (!smtp) {
        console.log("[password-reset] SMTP not configured. Reset link for", to, ":", resetUrl);
        return { delivered: false, logged: true };
    }

    const transporter = nodemailer.createTransport(smtp);
    await transporter.sendMail({ from, to, subject, text, html });
    return { delivered: true, logged: false };
}
