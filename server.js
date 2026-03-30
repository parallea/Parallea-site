const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const { handleWaitlistSignup } = require("./server/waitlist");

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "32kb" }));

app.post("/api/early-access", async (req, res) => {
  const forwardedForHeader = req.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwardedForHeader)
    ? forwardedForHeader[0]
    : String(forwardedForHeader || req.socket.remoteAddress || "");

  const result = await handleWaitlistSignup({
    email: req.body?.email,
    ipAddress: ipAddress.split(",")[0].trim(),
  });

  res.status(result.statusCode).json(result.body);
});

if (isProduction) {
  const distPath = path.join(__dirname, "dist");

  app.use(
    express.static(distPath, {
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable"
          );
        }
      },
    })
  );

  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Parallea server listening on http://localhost:${port}`);
});
