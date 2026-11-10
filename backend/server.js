
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const handleRoutes = require("./routes");

const PORT = process.env.PORT || 5000;

const frontendPath = path.join(__dirname, "../frontend");

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(
            req.url,
            `http://${req.headers.host || "localhost"}`
        );

        res.setHeader("X-Content-Type-Options", "nosniff");

        if (url.pathname.startsWith("/api/")) {
            return await handleRoutes(req, res, url);
        }

        if (req.method !== "GET") {
            res.writeHead(405);
            return res.end("Method not allowed");
        }

        const allowedFiles = {
            "/": "index.html",
            "/index.html": "index.html",
            "/style.css": "style.css",
            "/script.js": "script.js"
        };

        const filename = allowedFiles[url.pathname];

        if (!filename) {
            res.writeHead(404);
            return res.end("Page not found");
        }

        const filePath = path.join(frontendPath, filename);

        fs.readFile(filePath, (error, data) => {
            if (error) {
                res.writeHead(500);
                return res.end("Unable to load page");
            }

            res.writeHead(200, {
                "Content-Type": mimeTypes[path.extname(filename)]
            });

            res.end(data);
        });

    } catch (error) {
        if (!res.headersSent) {
            res.writeHead(500, {
                "Content-Type": "application/json"
            });
        }

        res.end(JSON.stringify({
            error: "Internal server error"
        }));
    }
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Time Capsule server running at http://localhost:${PORT}`);
});
