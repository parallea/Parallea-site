const dotenv = require("dotenv");
const { defineConfig } = require("vite");
const { handleWaitlistSignup } = require("./server/waitlist");

dotenv.config({ quiet: true });

module.exports = defineConfig({
  plugins: [
    {
      name: "parallea-dev-waitlist-api",
      configureServer(server) {
        server.middlewares.use("/api/early-access", async (req, res, next) => {
          if (req.method !== "POST") {
            return next();
          }

          let rawBody = "";

          req.on("data", (chunk) => {
            rawBody += chunk;
          });

          req.on("end", async () => {
            let payload = {};

            try {
              payload = rawBody ? JSON.parse(rawBody) : {};
            } catch (_error) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  message: "Please submit a valid request body.",
                })
              );
              return;
            }

            const ipAddress =
              req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
              req.socket?.remoteAddress ||
              "";

            const result = await handleWaitlistSignup({
              email: payload.email,
              ipAddress,
            });

            res.statusCode = result.statusCode;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result.body));
          });
        });
      },
    },
  ],
});
