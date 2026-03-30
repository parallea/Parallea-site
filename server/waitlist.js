const nodemailer = require("nodemailer");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_BY_IP = 6;
const RATE_LIMIT_MAX_BY_EMAIL = 3;
const rateLimitStore = {
  ip: new Map(),
  email: new Map(),
};

let transporter = null;

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getConfig = () => {
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  return {
    dryRun: process.env.WAITLIST_DRY_RUN === "true",
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort,
    smtpSecure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    fromName: process.env.WAITLIST_FROM_NAME || "Ayush Kumar Bhardwaj",
    fromEmail:
      process.env.WAITLIST_FROM_EMAIL || "ayush@paralleatech.com",
    replyTo:
      process.env.WAITLIST_REPLY_TO ||
      process.env.WAITLIST_FROM_EMAIL ||
      "ayush@paralleatech.com",
    notificationTo: process.env.WAITLIST_NOTIFICATION_TO || "",
  };
};

const hasSmtpConfig = (config) =>
  Boolean(
    config.smtpHost &&
      Number.isFinite(config.smtpPort) &&
      config.smtpUser &&
      config.smtpPass
  );

const getTransporter = () => {
  if (transporter) return transporter;

  const config = getConfig();
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  return transporter;
};

const getRecentRequests = (store, key, now) => {
  const timestamps = store.get(key) || [];
  const recent = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length) {
    store.set(key, recent);
  } else {
    store.delete(key);
  }

  return recent;
};

const isRateLimited = ({ ipAddress, email }) => {
  const now = Date.now();

  const recentByIp = ipAddress
    ? getRecentRequests(rateLimitStore.ip, ipAddress, now)
    : [];
  const recentByEmail = getRecentRequests(rateLimitStore.email, email, now);

  return (
    recentByIp.length >= RATE_LIMIT_MAX_BY_IP ||
    recentByEmail.length >= RATE_LIMIT_MAX_BY_EMAIL
  );
};

const registerRequest = ({ ipAddress, email }) => {
  const now = Date.now();

  if (ipAddress) {
    const recentByIp = getRecentRequests(rateLimitStore.ip, ipAddress, now);
    rateLimitStore.ip.set(ipAddress, [...recentByIp, now]);
  }

  const recentByEmail = getRecentRequests(rateLimitStore.email, email, now);
  rateLimitStore.email.set(email, [...recentByEmail, now]);
};

const buildWelcomeText = () => [
  "Hi,",
  "",
  "Thank you for joining the Parallea waitlist. We're genuinely excited to have you here.",
  "",
  "We're Ayush Kumar Bhardwaj and Manish Kumar, the founders of Parallea. We started this journey with a simple belief: learning and interaction online should feel more human, more personal, and far more engaging than it does today.",
  "",
  "By joining the waitlist, you're not just signing up for early access - you're becoming one of the first people shaping what Parallea becomes.",
  "",
  "Over the next few weeks, we'll keep you updated with:",
  "- Early previews of what we're building",
  "- Opportunities to try features before anyone else",
  "- A chance to directly influence the product",
  "",
  "We're building Parallea for people like you, and we'd love to grow together.",
  "",
  "If you ever want to share ideas, feedback, or just say hello, we're always listening.",
  "",
  "Welcome aboard \u{1F680}",
  "Ayush & Manish",
  "Founders, Parallea",
].join("\n");

const buildWelcomeHtml = () => `
  <div style="margin:0;padding:32px 20px;background:#f4f1eb;font-family:Arial,sans-serif;color:#171717;">
    <div style="max-width:620px;margin:0 auto;padding:36px 32px;border-radius:24px;background:#ffffff;box-shadow:0 18px 45px rgba(0,0,0,0.08);">
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Hi,</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Thank you for joining the Parallea waitlist. We&rsquo;re genuinely excited to have you here.</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">We&rsquo;re Ayush Kumar Bhardwaj and Manish Kumar, the founders of Parallea. We started this journey with a simple belief: learning and interaction online should feel more human, more personal, and far more engaging than it does today.</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">By joining the waitlist, you&rsquo;re not just signing up for early access - you&rsquo;re becoming one of the first people shaping what Parallea becomes.</p>
      <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Over the next few weeks, we&rsquo;ll keep you updated with:</p>
      <ul style="margin:0 0 20px;padding-left:22px;font-size:16px;line-height:1.7;">
        <li>Early previews of what we&rsquo;re building</li>
        <li>Opportunities to try features before anyone else</li>
        <li>A chance to directly influence the product</li>
      </ul>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">We&rsquo;re building Parallea for people like you, and we&rsquo;d love to grow together.</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">If you ever want to share ideas, feedback, or just say hello, we&rsquo;re always listening.</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">Welcome aboard &#128640;</p>
      <p style="margin:0;font-size:16px;line-height:1.7;">Ayush &amp; Manish<br />Founders, Parallea</p>
    </div>
  </div>
`;

const buildNotificationText = (email) =>
  [
    "New Parallea waitlist signup",
    "",
    `Email: ${email}`,
    `Time: ${new Date().toISOString()}`,
  ].join("\n");

const buildNotificationHtml = (email) => `
  <div style="font-family:Arial,sans-serif;color:#171717;">
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">New Parallea waitlist signup</p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p style="margin:0;font-size:15px;line-height:1.6;"><strong>Time:</strong> ${escapeHtml(
      new Date().toISOString()
    )}</p>
  </div>
`;

const handleWaitlistSignup = async ({ email, ipAddress = "" }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const config = getConfig();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      statusCode: 400,
      body: {
        message: "Please enter a valid email address.",
      },
    };
  }

  if (config.dryRun) {
    registerRequest({ ipAddress, email: normalizedEmail });
    console.log(`[waitlist:dry-run] ${normalizedEmail}`);

    return {
      statusCode: 200,
      body: {
        message: "Local waitlist test worked. Dry-run mode is on, so no email was sent.",
      },
    };
  }

  if (!hasSmtpConfig(config)) {
    return {
      statusCode: 500,
      body: {
        message: "Waitlist email is not configured on the server yet.",
      },
    };
  }

  if (isRateLimited({ ipAddress, email: normalizedEmail })) {
    return {
      statusCode: 429,
      body: {
        message: "Too many attempts right now. Please try again in a few minutes.",
      },
    };
  }

  try {
    const mailer = getTransporter();
    const from = `${config.fromName} <${config.fromEmail}>`;

    await mailer.sendMail({
      from,
      to: normalizedEmail,
      replyTo: config.replyTo,
      subject: "Glad to have you with us",
      text: buildWelcomeText(),
      html: buildWelcomeHtml(),
    });

    if (config.notificationTo.trim()) {
      await mailer.sendMail({
        from,
        to: config.notificationTo,
        replyTo: config.replyTo,
        subject: `New waitlist signup: ${normalizedEmail}`,
        text: buildNotificationText(normalizedEmail),
        html: buildNotificationHtml(normalizedEmail),
      });
    }

    registerRequest({ ipAddress, email: normalizedEmail });

    return {
      statusCode: 200,
      body: {
        message: "You're on the waitlist. Check your inbox for a welcome note.",
      },
    };
  } catch (error) {
    console.error("Waitlist email failed:", error);

    return {
      statusCode: 500,
      body: {
        message: "We couldn't complete your signup right now. Please try again shortly.",
      },
    };
  }
};

module.exports = {
  handleWaitlistSignup,
};
