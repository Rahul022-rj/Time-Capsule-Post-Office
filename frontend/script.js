
const form = document.getElementById("letterForm");
const message = document.getElementById("message");
const letterList = document.getElementById("letterList");

const unlockInput = document.getElementById("unlockAt");

let countdownInterval;

// Set minimum unlock date to current local time.
function setMinimumDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    unlockInput.min = now.toISOString().slice(0, 16);
}

setMinimumDate();

// FORMAT COUNTDOWN
function formatCountdown(unlockAt) {
    const difference =
        new Date(unlockAt).getTime() - Date.now();

    if (difference <= 0) {
        return "Your letter is ready to open!";
    }

    const days = Math.floor(
        difference / (1000 * 60 * 60 * 24)
    );

    const hours = Math.floor(
        (difference / (1000 * 60 * 60)) % 24
    );

    const minutes = Math.floor(
        (difference / (1000 * 60)) % 60
    );

    const seconds = Math.floor(
        (difference / 1000) % 60
    );

    return `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
}

// UPDATE DASHBOARD STATISTICS
function updateStatistics(letters) {
    const now = Date.now();

    const locked = letters.filter(letter =>
        new Date(letter.unlockAt).getTime() > now
    ).length;

    document.getElementById("totalCount").textContent =
        letters.length;

    document.getElementById("lockedCount").textContent =
        locked;

    document.getElementById("unlockedCount").textContent =
        letters.length - locked;
}

// CREATE LETTER
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();

    const dateValue = unlockInput.value;

    if (!title || !content || !dateValue) {
        showMessage("Please complete all fields.", true);
        return;
    }

    const unlockDate = new Date(dateValue);

    if (
        Number.isNaN(unlockDate.getTime()) ||
        unlockDate.getTime() <= Date.now()
    ) {
        showMessage("Please select a future date and time.", true);
        return;
    }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sealing your letter...";

    try {
        const response = await fetch("/api/letters", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                content,
                unlockAt: unlockDate.toISOString()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to create letter");
        }

        showMessage(
            "Your time capsule has been sealed successfully!",
            false
        );

        form.reset();
        setMinimumDate();

        await loadLetters();

    } catch (error) {
        showMessage(error.message, true);

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Seal My Letter ✉";
    }
});

// SHOW SUCCESS OR ERROR MESSAGE
function showMessage(text, isError) {
    message.textContent = text;
    message.className = isError ? "error" : "success";
}

// LOAD ALL LETTERS
async function loadLetters() {
    try {
        const response = await fetch("/api/letters");
        const letters = await response.json();

        if (!response.ok) {
            throw new Error("Unable to load letters");
        }

        updateStatistics(letters);

        letterList.replaceChildren();

        if (letters.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent =
                "No time capsules yet. Create your first letter!";
            letterList.appendChild(empty);
            return;
        }

        letters.forEach(letter => {
            const card = document.createElement("div");
            card.className = "letter-card";
            card.dataset.id = letter.id;
            card.dataset.unlockAt = letter.unlockAt;

            const title = document.createElement("h3");
            title.textContent = letter.title;

            const date = document.createElement("p");
            date.textContent =
                "Unlock date: " +
                new Date(letter.unlockAt).toLocaleString();

            const status = document.createElement("p");
            status.className = "status";

            const countdown = document.createElement("p");
            countdown.className = "countdown";

            const actions = document.createElement("div");
            actions.className = "card-actions";

            const openButton = document.createElement("button");
            openButton.className = "open-btn";
            openButton.textContent = "Open Letter";

            openButton.addEventListener("click", () => {
                openLetter(letter.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", () => {
                deleteLetter(letter.id);
            });

            actions.append(openButton, deleteButton);

            card.append(
                title,
                date,
                status,
                countdown,
                actions
            );

            letterList.appendChild(card);
        });

        updateCountdowns();

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            updateCountdowns();
        }, 1000);

    } catch (error) {
        letterList.textContent = error.message;
    }
}

// UPDATE ALL COUNTDOWNS
function updateCountdowns() {
    const cards = document.querySelectorAll(".letter-card");
    const now = Date.now();

    cards.forEach(card => {
        const unlockAt = card.dataset.unlockAt;
        const difference = new Date(unlockAt).getTime() - now;

        const status = card.querySelector(".status");
        const countdown = card.querySelector(".countdown");
        const openButton = card.querySelector(".open-btn");

        if (difference <= 0) {
            status.textContent = "Status: Unlocked";
            countdown.textContent = "Your letter is ready!";
            openButton.disabled = false;
            openButton.textContent = "Open Letter";
        } else {
            status.textContent = "Status: Locked";
            countdown.textContent = formatCountdown(unlockAt);
            openButton.disabled = true;
            openButton.textContent = "Letter Locked";
        }
    });

    const cardsArray = Array.from(cards);
    const lockedCount = cardsArray.filter(card =>
        new Date(card.dataset.unlockAt).getTime() > now
    ).length;

    document.getElementById("lockedCount").textContent =
        lockedCount;

    document.getElementById("unlockedCount").textContent =
        cardsArray.length - lockedCount;
}

// OPEN LETTER
async function openLetter(id) {
    try {
        const response = await fetch(`/api/letters/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error);
        }

        document.getElementById("modalTitle").textContent =
            data.title;

        document.getElementById("modalDate").textContent =
            "Created: " +
            new Date(data.createdAt).toLocaleString();

        document.getElementById("modalBody").textContent =
            data.content;

        document.getElementById("modal").classList.remove("hidden");

    } catch (error) {
        alert(error.message);
        await loadLetters();
    }
}

// DELETE LETTER
async function deleteLetter(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this time capsule?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/letters/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        showMessage("Time capsule deleted successfully.", false);

        await loadLetters();

    } catch (error) {
        alert(error.message);
    }
}

// CLOSE MODAL
document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("modal").classList.add("hidden");
});

// CLOSE MODAL WHEN CLICKING OUTSIDE
document.getElementById("modal").addEventListener("click", (event) => {
    if (event.target.id === "modal") {
        event.currentTarget.classList.add("hidden");
    }
});

// INITIAL LOAD
loadLetters();
