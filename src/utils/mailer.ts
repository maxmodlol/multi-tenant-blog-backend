import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  if (process.env.SMTP_URL) {
    transporter = nodemailer.createTransport(process.env.SMTP_URL);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendResetEmail(to: string, link: string) {
  const t = getTransporter();
  const from =
    process.env.MAIL_FROM ||
    "no-reply@" + (process.env.MAIN_DOMAIN || "localhost");
  await t.sendMail({
    from,
    to,
    subject: "Password reset",
    text: `Click the link to reset your password: ${link}`,
    html: `<p>Click the link to reset your password:</p><p><a href="${link}">${link}</a></p>`,
  });
}
