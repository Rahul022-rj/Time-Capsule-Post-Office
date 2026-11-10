
const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/letters.json");

async function getLetters() {
    try {
        const data = await fs.readFile(DATA_FILE, "utf8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            await fs.mkdir(path.dirname(DATA_FILE), {
                recursive: true
            });
            await fs.writeFile(DATA_FILE, "[]", "utf8");
            return [];
        }
        throw error;
    }
}

async function saveLetters(letters) {
    const tempFile = DATA_FILE + ".tmp";

    await fs.writeFile(
        tempFile,
        JSON.stringify(letters, null, 2),
        "utf8"
    );

    await fs.rename(tempFile, DATA_FILE);
}

module.exports = { getLetters, saveLetters };
