import waitlistModule from "../server/waitlist.js";

const { handleWaitlistSignup } = waitlistModule;

const json = (body, status) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

const getIpAddress = (request) => {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return forwardedFor.split(",")[0].trim();
};

const parsePayload = async (request) => {
  const rawBody = await request.text();

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    return null;
  }
};

export async function POST(request) {
  const payload = await parsePayload(request);

  if (!payload) {
    return json({ message: "Please submit a valid request body." }, 400);
  }

  const result = await handleWaitlistSignup({
    email: payload.email,
    ipAddress: getIpAddress(request),
  });

  return json(result.body, result.statusCode);
}

export function GET() {
  return json({ message: "Method not allowed." }, 405);
}
