document.addEventListener("DOMContentLoaded", function () {
    const playButton = document.getElementById("play");
    const closeButton = document.getElementById("close");
    const startButton = document.getElementById("start");
    const circle = document.getElementById("circle");
    const anim = document.querySelector(".anim");
    const controls = document.querySelector(".controls");
    const workField = document.getElementById("work");
    const messages = document.getElementById("messageForm");
    const radius = 10; 
    let isAnimating = false; 
    let animationInterval;
    let eventId = 1;
    document.addEventListener("DOMContentLoaded", clearEvents());

    playButton.addEventListener("click", function () {
        const text = document.getElementById("text");
        text.style.display = "none";
        workField.style.display = "block"; 
        setTimeout(() => {
            resetCircle();
        }, 0);
        logEvent("Play button is pressed"); 
        messages.innerHTML = `<p>Play button is pressed</p>`;
    });

    startButton.addEventListener("click", StartAnimation);

    closeButton.addEventListener("click", async function () {
        logEvent("Close button is pressed");
        messages.innerHTML = `<p>Close button is pressed</p>`;

        const serverEvents = await fetchServerEvents();
        const tableHTML = generateEventTable(serverEvents);
        text.innerHTML = tableHTML;
        text.style.display = "block";
        workField.style.display = "none";
    });

    function resetCircle() {
        isAnimating = false;
        clearInterval(animationInterval);
        x = anim.offsetWidth / 2 - radius / 2;
        y = anim.offsetHeight / 2 - radius / 2;
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
        step = 1;
        direction = "left";
        quadrantVisits = { 1: false, 2: false, 3: false, 4: false };
    }

    function StartAnimation() {
        if (isAnimating) return;
        isAnimating = true; 
        startButton.disabled = true;
        logEvent("Start button is pressed");
        messages.innerHTML = `<p>Animation was started</p>`;
        moveCircle();
    }

    function moveCircle() {
        if (!isAnimating) return;
        animationInterval = setInterval(() => {
            switch (direction) {
                case "left":
                    x -= step;
                    logEvent(`Circle was moved ${step}px left`);
                    messages.innerHTML = `<p>Circle was moved ${step}px left</p>`;
                    direction = "up";
                    break;
                case "up":
                    y -= step;
                    logEvent(`Circle was moved ${step}px up`);
                    messages.innerHTML = `<p>Circle was moved ${step}px up</p>`;
                    direction = "right"; 
                    break;
                case "right":
                    x += step;
                    logEvent(`Circle was moved ${step}px right`);
                    messages.innerHTML = `<p>Circle was moved ${step}px right</p>`;
                    direction = "down"; 
                    break;
                case "down":
                    y += step;
                    logEvent(`Circle was moved ${step}px down`);
                    messages.innerHTML = `<p>Circle was moved ${step}px down</p>`;
                    direction = "left";
                    break;
            }

            step++;
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
            checkQuadrants();
            if (Object.values(quadrantVisits).every((visited) => visited)) {
                clearInterval(animationInterval);
                isAnimating = false; 
                logEvent("Animation was finished");
                messages.innerHTML = `<p>Animation was finished</p>`;
                updateButtonToReload();
            }
            closeButton.disabled = false; 
        }, 300);
    }

    function checkQuadrants() {
        const currentQuadrant = getQuadrant(x, y);
        if (currentQuadrant && !quadrantVisits[currentQuadrant]) {
            quadrantVisits[currentQuadrant] = true;
            messages.innerHTML = `<p>Circle has entered the quadrant ${currentQuadrant}</p>`;
            logEvent(`Circle has entered the quadrant ${currentQuadrant}`);
        }
    }

    function getQuadrant(x, y) {
        const centerX = anim.offsetWidth / 2;
        const centerY = anim.offsetHeight / 2;

        const leftBoundary = centerX - radius;
        const rightBoundary = centerX + radius;
        const topBoundary = centerY - radius;
        const bottomBoundary = centerY + radius;

        if (x < (leftBoundary - 8) && y < (topBoundary - 8)) return 1; 
        if (x >= rightBoundary && y < topBoundary) return 2;
        if (x < leftBoundary && y >= bottomBoundary) return 3;
        if (x >= rightBoundary && y >= bottomBoundary) return 4;
        return null; 
    }

    function updateButtonToReload() {
        const button = document.getElementById("start");
        button.id = "reload";
        button.innerText = "Reload";
        button.disabled = false;
        button.onclick = ReloadClick;
    }

    function ReloadClick() {
        logEvent("Reload button is pressed");
        messages.innerHTML = `<p>Reload button is pressed</p>`;
        resetCircle();
        isAnimating = false;
        const button = document.getElementById("reload");
        button.id = "start";
        button.innerText = "Start";
        button.disabled = false;
        button.onclick = StartAnimation; 
    }

    async function logEvent(event) {
        const date = new Date();
        const eventData = {
            id: eventId++,
            time: date.toISOString(), 
            message: event
        };

        try {
            const response = await fetch("index.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ events: [eventData] }),
            });

            if (!response.ok) {
                throw new Error("Failed to log event to the server.");
            }
        } catch (error) {
            console.error("Error sending event to the server:", error);
        }
    }

    async function fetchServerEvents() {
        try {
            const response = await fetch("index.php", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Network request failed");
            }

            const data = await response.json();
            return data.events || [];
        } catch (error) {
            console.error("Error retrieving events from server:", error);
            return [];
        }
    }

      function generateEventTable(serverEvents) {
        let table = `<table border="1" style="width: 100%; text-align: left;">
        <thead>
            <tr>
                <th>Events (LocalStorage)</th>
                <th>Events (Server)</th>
            </tr>
        </thead>
        <tbody>`;

        const localEvents = [];
        const maxRows = Math.max(localEvents.length, serverEvents.length);
        for (let i = 0; i < maxRows; i++) {
            const localEvent = localEvents[i] || "";
            const serverEvent = serverEvents[i] ? `${serverEvents[i].id}. ${serverEvents[i].message} (${new Date(serverEvents[i].time).toLocaleString()})` : "";
            table += `<tr>
                <td>${localEvent}</td>
                <td>${serverEvent}</td>
            </tr>`;
        }
        table += `</tbody>
        </table>`;
        return table;
        }

        async function clearEvents() {
            try {
            const response = await fetch("index.php", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to clear events on the server.");
            }
            console.log("Server events cleared successfully.");
        } catch (error) {
            console.error("Error clearing server events:", error);
        }
        }
});

