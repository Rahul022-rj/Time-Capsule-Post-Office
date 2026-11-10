
const {
    createLetter,
    getAllLetters,
    getLetterById,
    deleteLetter
} = require("./letterController");

function sendJSON(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify(data));
}

async function handleRoutes(req, res, url) {
    const pathname = url.pathname;

    if (req.method === "POST" && pathname === "/api/letters") {
        return createLetter(req, res);
    }

    if (req.method === "GET" && pathname === "/api/letters") {
        return getAllLetters(req, res);
    }

    const match = pathname.match(
        /^\/api\/letters\/([a-f0-9-]+)$/i
    );

    if (match) {
        const id = match[1];

        if (req.method === "GET") {
            return getLetterById(req, res, id);
        }

        if (req.method === "DELETE") {
            return deleteLetter(req, res, id);
        }
    }

    return sendJSON(res, 404, {
        error: "API route not found"
    });
}

module.exports = handleRoutes;
