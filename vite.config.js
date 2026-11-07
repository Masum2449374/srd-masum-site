import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  const sandbox =
    command === "serve" && process.env.VITE_DESIGN_SANDBOX === "1";
  return {
    plugins: [
      react(),
      ...(sandbox
        ? [
            {
              name: "local-design-safety",
              enforce: "pre",
              transformIndexHtml: {
                order: "pre",
                handler(html) {
                  // No third-party scripts, inline ad handlers, analytics, or service workers in local review.
                  return html.replace(
                    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
                    (tag) =>
                      /type="module"[^>]*src="\/src\/main.jsx"/.test(tag)
                        ? tag
                        : "",
                  );
                },
              },
              configureServer(server) {
                server.middlewares.use((req, res, next) => {
                  const path = (req.url || "").split("?")[0];
                  if (
                    path === "/go" ||
                    path.startsWith("/go/") ||
                    path.startsWith("/ads/") ||
                    path === "/sw.js"
                  ) {
                    res.writeHead(204);
                    return res.end();
                  }
                  if (!path.startsWith("/api/")) return next();
                  const data =
                    path === "/api/plays"
                      ? { plays: {} }
                      : path === "/api/visits"
                        ? { count: null }
                        : path.includes("users/search")
                          ? { users: [], songs: [] }
                          : path.includes("chat")
                            ? {
                                reply:
                                  "Mira is available on the live site. This local design preview does not send messages.",
                              }
                            : { counted: false, user: null, ok: true };
                  res.writeHead(200, {
                    "content-type": "application/json",
                    "cache-control": "no-store",
                    "x-design-sandbox": "1",
                  });
                  res.end(JSON.stringify(data));
                });
              },
            },
          ]
        : []),
    ],
    base: "/",
    build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
  };
});
