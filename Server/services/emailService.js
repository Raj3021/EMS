import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth:
        smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null;

export async function sendInviteEmail({ to, firstName, inviteLink }) {
  if (!transporter) {
    console.log("SMTP not configured. Invite link:", inviteLink);
    return;
  }

  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const subject = "You're invited to WorkHub";
  const text = `${greeting}

You have been invited to WorkHub. Use the link below to set your password and complete your profile:
${inviteLink}

If you did not expect this invite, you can ignore this email.`;
  const html = `<p>${greeting}</p>
<p>You have been invited to WorkHub. Use the link below to set your password and complete your profile:</p>
<p><a href="${inviteLink}">${inviteLink}</a></p>
<p>If you did not expect this invite, you can ignore this email.</p>`;

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
    html,
  });
}
