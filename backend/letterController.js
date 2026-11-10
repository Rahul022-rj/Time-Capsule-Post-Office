
const crypto = require("crypto");
const { getLetters, saveLetters } = require("./storage");

function sendJSON(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify(data));
}

// CREATE LETTER
async function createLetter(req, res) {
    try {
        let body = "";

        for await (const chunk of req) {
            body += chunk;

            if (Buffer.byteLength(body) > 100000) {
                return sendJSON(res, 413, {
                    error: "Request too large"
                });
            }
        }

        const { title, content, unlockAt } = JSON.parse(body);

        if (
            typeof title !== "string" ||
            typeof content !== "string" ||
            typeof unlockAt !== "string" ||
            !title.trim() ||
            !content.trim()
        ) {
            return sendJSON(res, 400, {
                error: "Title, content and unlock date are required"
            });
        }

        const unlockDate = new Date(unlockAt);

        if (
            Number.isNaN(unlockDate.getTime()) ||
            unlockDate.getTime() <= Date.now()
        ) {
            return sendJSON(res, 400, {
                error: "Unlock date must be in the future"
            });
        }

        const letters = await getLetters();

        const newLetter = {
            id: crypto.randomUUID(),
            title: title.trim(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
            unlockAt: unlockDate.toISOString()
        };

        letters.push(newLetter);

        await saveLetters(letters);

        return sendJSON(res, 201, {
            message: "Time capsule created successfully",
            letter: {
                id: newLetter.id,
                title: newLetter.title,
                createdAt: newLetter.createdAt,
                unlockAt: newLetter.unlockAt
            }
        });

    } catch (error) {
        return sendJSON(res, 400, {
            error: "Invalid request data"
        });
    }
}

// GET ALL LETTERS
async function getAllLetters(req, res) {
    try {
        const letters = await getLetters();

        const result = letters.map(letter => {
            const unlocked =
                Date.now() >= new Date(letter.unlockAt).getTime();

            return {
                id: letter.id,
                title: letter.title,
                createdAt: letter.createdAt,
                unlockAt: letter.unlockAt,
                status: unlocked ? "unlocked" : "locked"
            };
        });

        return sendJSON(res, 200, result);

    } catch (error) {
        return sendJSON(res, 500, {
            error: "Unable to retrieve letters"
        });
    }
}

// GET LETTER BY ID
async function getLetterById(req, res, id) {
    try {
        const letters = await getLetters();

        const letter = letters.find(item => item.id === id);

        if (!letter) {
            return sendJSON(res, 404, {
                error: "Letter not found"
            });
        }

        const unlocked =
            Date.now() >= new Date(letter.unlockAt).getTime();

        if (!unlocked) {
            return sendJSON(res, 403, {
                message: "This letter is still locked",
                unlockAt: letter.unlockAt,
                status: "locked"
            });
        }

        return sendJSON(res, 200, {
            id: letter.id,
            title: letter.title,
            content: letter.content,
            createdAt: letter.createdAt,
            unlockAt: letter.unlockAt,
            status: "unlocked"
        });

    } catch (error) {
        return sendJSON(res, 500, {
            error: "Unable to retrieve letter"
        });
    }
}

// DELETE LETTER
async function deleteLetter(req, res, id) {
    try {
        const letters = await getLetters();

        const index = letters.findIndex(item => item.id === id);

        if (index === -1) {
            return sendJSON(res, 404, {
                error: "Letter not found"
            });
        }

        letters.splice(index, 1);
        await saveLetters(letters);

        return sendJSON(res, 200, {
            message: "Letter deleted successfully"
        });

    } catch (error) {
        return sendJSON(res, 500, {
            error: "Unable to delete letter"
        });
    }
}

module.exports = {
    createLetter,
    getAllLetters,
    getLetterById,
    deleteLetter
};
