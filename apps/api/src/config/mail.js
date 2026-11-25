import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import { env } from "./env.js";
import { logger } from "./logger.js";

let transporter;
let usingEthereal = false;

async function getTransport() {
  if (transporter) return transporter;
  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    return transporter;
  }
  if (env.NODE_ENV === "production" || env.NODE_ENV === "test") return null;
  try {
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    usingEthereal = true;
    logger.info("Email is using an Ethereal test inbox");
    return transporter;
  } catch (error) {
    logger.warn("Email transport is unavailable", error.message);
    return null;
  }
}

export async function sendTemplatedEmail({ to, subject, intro, action, outro }) {
  const transport = await getTransport();
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Neera Pace Cricket Academy",
      link: env.CLIENT_ORIGIN,
    },
  });
  const email = {
    body: {
      name: to.name || "there",
      intro,
      action: action
        ? {
            instructions: action.instructions,
            button: { color: "#12372a", text: action.text, link: action.link },
          }
        : undefined,
      outro: outro || "This message was sent by Neera Pace Cricket Academy.",
    },
  };
  if (!transport) {
    logger.warn("Email skipped because SMTP is not configured", { to: to.email, subject });
    return { skipped: true };
  }
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to: to.email,
    subject,
    html: mailGenerator.generate(email),
    text: mailGenerator.generatePlaintext(email),
  });
  if (usingEthereal) logger.info("Email preview", nodemailer.getTestMessageUrl(info));
  return { skipped: false, messageId: info.messageId };
}
