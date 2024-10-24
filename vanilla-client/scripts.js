// Month and day names constants
const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// DOM elements
const carouselContainer = document.getElementById("carouselContainer");
const leftArrow = document.querySelector(".nav-arrow.left");
const rightArrow = document.querySelector(".nav-arrow.right");
const ghpSidebar = document.getElementById("ghp-sidebar");
const sidebarButton = document.getElementById("sidebar-button");
const ghpContainer = document.getElementById("ghpContainer");
const streakDisplay = document.getElementById("streakDisplay");
const selectedGHP = document.getElementById("selectedGHP");
const ghpInput = document.getElementById("newGHPInput");
const addGHPButton = document.getElementById("addGHPButton");
const resetCalenderButton = document.getElementById("resetCalenderButton");
const logoutButton = document.getElementById("logoutButton");
const totalGhpCheckedSpan = document.getElementById("totalGhpChecked");
const downloadCalenderButton = document.getElementById("downloadCalender");
const addNoteModal = document.getElementById("addNoteModal");
const viewNoteModal = document.getElementById("viewNoteModal");
const loadinOverlay = document.getElementById("loadingOverlay");

let quill;

// State variables
let currentMonthIndex = new Date().getMonth();
let currentYear = new Date().getFullYear();

let currentGHP = null;
let userData = null;

// Fetch all user data at once
async function fetchUserData() {
    const accessToken = localStorage.getItem("jwt_token");

    loadinOverlay.classList.remove("hidden");

    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toLocaleDateString("en-CA");

    try {
        const response = await fetch(`${baseUrl}/user/data?today=${today}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            userData = await response.json();
            return userData;
        } else {
            return await refreshAndRequest(response, fetchUserData);
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        loadinOverlay.classList.add("hidden");
    }

    return null;
}

// Add a new GHP
async function addGHP(name) {
    const accessToken = localStorage.getItem("jwt_token");
    try {
        const response = await fetch(`${baseUrl}/ghp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name: name }),
        });
        if (response.ok) {
            const newGHP = await response.json();
            ghpList.push(newGHP);
            await fetchUserData(); // Refresh user data
            return newGHP;
        } else {
            return await refreshAndRequest(response, () => addGHP(name));
        }
    } catch (error) {
        console.error("Error adding GHP:", error);
    }
    return null;
}

// Update GHP list from userData
function updateGHPList() {
    if (userData && userData.ghps) {
        ghpList = userData.ghps;
    }
}

// Set current GHP
function setCurrentGHP(ghpId) {
    currentGHP = ghpList.find((ghp) => ghp.id === ghpId);
    updateCalendar();
}

function getTotalGhpChecked() {
    let totalGhpChecked = 0;
    ghpList.map((ghp) => {
        if (isTodayDateString(ghp.checked_days && ghp.checked_days[0])) {
            totalGhpChecked += 1;
        }
    });

    return totalGhpChecked;
}

function updateTotalGhpChecked(totalGhpChecked, totalGhps) {
    totalGhpCheckedSpan.innerText = `${totalGhpChecked}/${totalGhps}`;
}

// Update streak display
function updateStreakDisplay() {
    const streakElement = document.getElementById("streakDisplay");
    if (streakElement && currentGHP) {
        const { current_streak, max_streak } = currentGHP;
        streakElement.innerHTML = `<span>Current Streak: ${
            current_streak || 0
        } days <span style="margin: 0 5px;">|</span> Max Streak: ${
            max_streak || 0
        } days</span>`;
    }
}

// Update calendar view
function updateCalendar() {
    if (!currentGHP) {
        leftArrow.classList.add("hidden");
        rightArrow.classList.add("hidden");

        ghpContainer.classList.add("hidden");

        carouselContainer.innerHTML =
            "<p>Please select or create a <b>Goal Habit Progression</b> to view the streak calendar.</p>";
        return;
    }

    leftArrow.classList.remove("hidden");
    rightArrow.classList.remove("hidden");

    ghpContainer.classList.remove("hidden");

    updateCarousel();
    updateStreakDisplay();
}

// Reset calendar view to current month
function resetCalendar() {
    currentMonthIndex = new Date().getMonth();
    currentYear = new Date().getFullYear();
    updateCarousel();
}

// Check if the current view is the current month
function isCurrentMonthView() {
    const today = new Date();
    return (
        currentMonthIndex === today.getMonth() &&
        currentYear === today.getFullYear()
    );
}

// Update the visibility of the reset calendar button
function updateResetCalendarButtonVisibility() {
    if (isCurrentMonthView()) {
        resetCalenderButton.classList.add("hidden");
    } else {
        resetCalenderButton.classList.remove("hidden");
    }
}

async function toggleDayChecked(ghpId, date) {
    if (isTodayChecked() && userData.todays_notes[currentGHP.name]) {
        var confirmation = confirm(
            "Unchecking will result in the loss of your notes for today. Do you want to proceed?"
        );
        if (!confirmation) return false;
    }

    const accessToken = localStorage.getItem("jwt_token");

    try {
        const response = await fetch(`${baseUrl}/ghp/${ghpId}/check`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ date: date }),
        });

        if (response.ok) {
            await fetchUserData(); // Refresh all user data
            updateGHPList();

            updateGHPButtonStatus(ghpId);
            updateTotalGhpChecked(getTotalGhpChecked(), ghpList.length);
            updateTodaysNotesButton();

            return true;
        } else {
            return await refreshAndRequest(response, () =>
                toggleDayChecked(ghpId, date)
            );
        }
    } catch (error) {
        console.error("Error:", error);
    }

    return false;
}

function updateTodaysNotesButton() {
    // Update notes button icon (add or edit)
    document.querySelector(
        '.ghp-button[data-id="' + currentGHP.id + '"]'
    ).parentElement.childNodes[1].childNodes[0].innerText = userData
        .todays_notes[currentGHP.name]
        ? "edit_note"
        : "note_add";
}

function updateGHPButtonStatus(ghpId) {
    const button = document.querySelector(`.ghp-button[data-id="${ghpId}"]`);
    if (button) {
        const ghp = ghpList.find((g) => g.id === ghpId);
        if (
            ghp &&
            ghp.checked_days &&
            ghp.checked_days.length > 0 &&
            isTodayDateString(ghp.checked_days[0])
        ) {
            button.classList.add("checked");
        } else {
            button.classList.remove("checked");
        }
    }
}

// Add click listener to day elements
function addDayClickListener(dayElement, year, month, day) {
    dayElement.addEventListener("click", async () => {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            day
        ).padStart(2, "0")}`;

        if (isToday(year, month, day)) {
            const success = await toggleDayChecked(currentGHP.id, date);
            if (success) {
                dayElement.classList.toggle("selected");
                setCurrentGHP(currentGHP.id);
            }
        } else {
            if (currentGHP.checked_days.includes(date)) {
                const notes = await getNotesByDate(currentGHP.id, date);

                if (notes) {
                    viewNoteModal.style.display = "block";
                    viewNoteModal.querySelector("#notesContent").innerHTML =
                        notes.html_content;
                    viewNoteModal.querySelector(".ghp-name").innerHTML =
                        currentGHP.name;
                    viewNoteModal.querySelector(".date").innerText = date;
                }
            }
        }
    });
}

// Check if a given date matches today's date
function isToday(year, month, day) {
    const today = new Date();
    return (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate()
    );
}

// check is it's today with full date
function isTodayDateString(dateString) {
    // Parse the date string into a Date object
    const date = new Date(dateString);

    // Get today's date
    const today = new Date();

    // Compare year, month, and day
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}

function isTodayChecked() {
    return currentGHP.current_streak !== 0;
}

// Create a month calendar DOM element
function createMonthCalendar(year, month) {
    const monthElement = createMonthElement(monthNames[month], year);
    const daysElement = createDaysElement(year, month);

    monthElement.appendChild(createWeekdaysHeader());
    monthElement.appendChild(daysElement);
    return monthElement;
}

// Create a month header element
function createMonthElement(monthName, year) {
    const monthElement = document.createElement("div");
    monthElement.className = "month";

    const headerElement = document.createElement("div");
    headerElement.className = "month-header";
    headerElement.textContent = `${monthName} ${year}`;

    monthElement.appendChild(headerElement);
    return monthElement;
}

// Create weekdays header elements
function createWeekdaysHeader() {
    const weekdaysElement = document.createElement("div");
    weekdaysElement.className = "weekdays";

    dayNames.forEach((day) => {
        const dayElement = document.createElement("div");
        dayElement.textContent = day;
        weekdaysElement.appendChild(dayElement);
    });

    return weekdaysElement;
}

// Create days element for the month calendar
function createDaysElement(year, month) {
    const daysElement = document.createElement("div");
    daysElement.className = "days";

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    addEmptyDays(daysElement, firstDayOfMonth);
    addActualDays(daysElement, year, month, daysInMonth);

    return daysElement;
}

// Add empty days to align the first day of the month correctly
function addEmptyDays(daysElement, firstDayOfMonth) {
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDayElement = document.createElement("div");
        emptyDayElement.className = "day empty";
        daysElement.appendChild(emptyDayElement);
    }
}

// Add actual day elements for the month
function addActualDays(daysElement, year, month, daysInMonth) {
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");
        dayElement.className = "day";
        dayElement.textContent = day;

        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            day
        ).padStart(2, "0")}`;
        if (currentGHP.checked_days?.includes(date)) {
            dayElement.classList.add("selected");
        }

        applyDayStyles(dayElement, year, month, day);
        addDayClickListener(dayElement, year, month, day);
        daysElement.appendChild(dayElement);
    }
}

// Apply styles to day elements based on their status (today, past, future)
function applyDayStyles(dayElement, year, month, day) {
    const today = new Date();
    const isPast =
        year < today.getFullYear() ||
        (year === today.getFullYear() && month < today.getMonth()) ||
        (year === today.getFullYear() &&
            month === today.getMonth() &&
            day < today.getDate());

    if (isToday(year, month, day)) {
        dayElement.classList.add("today");
    } else if (isPast) {
        dayElement.classList.add("past");
    } else {
        dayElement.classList.add("future");
    }
}

// Update the carousel with the visible months
function updateCarousel() {
    carouselContainer.innerHTML = "";

    for (let i = -2; i <= 2; i++) {
        const { monthIndex, year } = getRelativeMonth(i);
        const monthElement = createMonthCalendar(year, monthIndex);
        monthElement.style.flex = "0 0 33.333%";
        carouselContainer.appendChild(monthElement);
    }

    setCarouselPosition(-33.333);
    updateResetCalendarButtonVisibility();
}

// Get the month index and year relative to the current month/year
function getRelativeMonth(offset) {
    let monthIndex = currentMonthIndex + offset;
    let year = currentYear;

    if (monthIndex < 0) {
        monthIndex += 12;
        year--;
    } else if (monthIndex > 11) {
        monthIndex -= 12;
        year++;
    }

    return { monthIndex, year };
}

// Set the carousel position using translateX
function setCarouselPosition(percentage) {
    carouselContainer.style.transform = `translateX(${percentage}%)`;
}

// Move the carousel in the specified direction
function moveCarousel(direction) {
    const movePercentage = direction * 33.333;
    carouselContainer.style.transition = "transform 0.3s ease-in-out";
    setCarouselPosition(-33.333 - movePercentage);

    setTimeout(() => {
        carouselContainer.style.transition = "none";
        updateMonthAndYear(direction);
        updateCarousel();
    }, 300);
}

// Update current month and year based on the direction of carousel movement
function updateMonthAndYear(direction) {
    currentMonthIndex += direction;

    if (currentMonthIndex < 0) {
        currentMonthIndex = 11;
        currentYear--;
    } else if (currentMonthIndex > 11) {
        currentMonthIndex = 0;
        currentYear++;
    }
}

// Event listeners for arrow buttons
leftArrow.addEventListener("click", () => moveCarousel(-1));
rightArrow.addEventListener("click", () => moveCarousel(1));

function updateGhpInfoUI(ghp) {
    if (ghp === null) return;
    selectedGHP.textContent = ghp.name;
}

function toggleGHPSidebar() {
    ghpSidebar.classList.toggle("hidden");
    sidebarButton.classList.toggle("hidden");

    if (sidebarButton.classList.contains("hidden")) {
        sidebarButton.innerHTML = `<span class="material-icons">arrow_forward</span>`;
    } else {
        sidebarButton.innerHTML = `<span class="material-icons">arrow_back</span>`;
    }
}

async function deleteGHP(ghpId) {
    var confirmation = confirm(
        `Are you sure you want to delete "${
            ghpList.find((ghp) => ghp.id === ghpId).name
        }"?`
    );

    if (!confirmation) return;

    const accessToken = localStorage.getItem("jwt_token");
    try {
        const response = await fetch(`${baseUrl}/ghp/${ghpId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (response.ok) {
            console.log("GHP deleted successfully");
            await fetchUserData();
            updateGHPList();

            document
                .querySelector('.ghp-button[data-id="' + ghpId + '"]')
                .parentElement.remove();

            if (ghpList.length === 0) {
                currentGHP = null;
                updateGhpInfoUI(null);
            }
            if (ghpId === currentGHP.id) {
                console.log("Current GHP deleted, setting new current GHP");
                document
                    .querySelector(
                        '.ghp-button[data-id="' + ghpList[0].id + '"]'
                    )
                    .classList.add("active");
                setCurrentGHP(ghpList[0].id);
                updateGhpInfoUI(ghpList[0]);
            }
            updateTotalGhpChecked(getTotalGhpChecked(), ghpList.length);
            updateCalendar();
        } else {
            await refreshAndRequest(response, () => deleteGHP(ghpId));
        }
    } catch (error) {
        console.error("Error deleting GHP:", error);
    }
    return null;
}

async function getNotesByDate(ghpId, date) {
    const accessToken = localStorage.getItem("jwt_token");
    try {
        const response = await fetch(
            `${baseUrl}/checked_days/${ghpId}/${date}/notes`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            return await refreshAndRequest(response, () =>
                getNotesByDate(ghpId, date)
            );
        }
    } catch (error) {
        console.error("Error fetching notes:", error);
    }

    return null;
}

async function addTodaysNotes(ghpId, notes, checkToday, updateTodaysNotes) {
    const today = new Date().toLocaleDateString("en-CA");

    if (checkToday) {
        await toggleDayChecked(ghpId, today);
    }

    let requestType = "POST";
    if (updateTodaysNotes) {
        requestType = "PUT";
    }

    const accessToken = localStorage.getItem("jwt_token");
    try {
        const response = await fetch(
            `${baseUrl}/checked_days/${ghpId}/${today}/notes`,
            {
                method: requestType,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ html_content: notes, date: today }),
            }
        );
        if (response.ok) {
            console.log("Notes added successfully");

            await fetchUserData();
        } else {
            await refreshAndRequest(response, () =>
                addTodaysNotes(ghpId, notes, checkToday, updateTodaysNotes)
            );
        }
    } catch (error) {
        console.error("Error adding notes:", error);
    }
}

function createGHPButton(ghp) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.classList.add("ghp-button");
    button.classList.add(ghp.id);
    button.dataset.id = ghp.id;
    button.textContent = ghp.name;

    const addNotesButton = document.createElement("button");
    addNotesButton.classList.add("add-notes-button");
    addNotesButton.innerHTML = `<span class="material-icons">${
        userData.todays_notes[ghp.name] ? "edit_note" : "note_add"
    }</span>`;

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");
    deleteButton.innerHTML = `<span class="material-icons">delete</span>`;
    deleteButton.addEventListener("click", async () => {
        await deleteGHP(ghp.id);
    });

    li.appendChild(button);
    li.appendChild(addNotesButton);
    li.appendChild(deleteButton);

    addNotesButton.addEventListener("click", async () => {
        addNoteModal.style.display = "block";
        quill.root.innerHTML = userData.todays_notes[ghp.name] || "";
        addNoteModal.querySelector(".ghp-name").textContent = ghp.name;

        setCurrentGHP(ghp.id);
        updateGhpInfoUI(ghp);
        resetCalendar();
        document
            .querySelectorAll(".ghp-button")
            .forEach((button) => button.classList.remove("active"));
        button.classList.add("active");

        if (!isTodayChecked() === 0) {
            addNoteModal.querySelector("#addNote").innerText =
                "Mark Today and Add Note";
        } else {
            addNoteModal.querySelector("#addNote").innerText = `${
                userData.todays_notes[ghp.name] ? "Update" : "Add"
            } Note`;
        }
    });

    button.addEventListener("click", (e) => {
        setCurrentGHP(ghp.id);
        updateGhpInfoUI(ghp);
        resetCalendar();
        addNoteModal.style.display = "none";
        viewNoteModal.style.display = "none";
        document
            .querySelectorAll(".ghp-button")
            .forEach((button) => button.classList.remove("active"));
        e.target.classList.add("active");
    });
    // Set the button as active because newly created ghp is set as current
    document
        .querySelectorAll(".ghp-button")
        .forEach((button) => button.classList.remove("active"));
    // click the recently added ghp to set it as active
    button.click();

    return li;
}

function populateSidebar() {
    ghpList.forEach((ghp) => {
        const li = createGHPButton(ghp);
        ghpSidebar.appendChild(li);
    });
}

function downloadStreakCalendar() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Parse checked days
    const checkedDays = currentGHP.checked_days.map((day) => new Date(day));
    const startDate = new Date(Math.min(...checkedDays));
    const endDate = new Date(Math.max(...checkedDays));

    // Calculate total months
    const totalMonths =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        endDate.getMonth() -
        startDate.getMonth() +
        1;

    // Set canvas size and layout parameters
    const monthWidth = 350;
    const monthHeight = 300;
    const padding = 30;
    const headerHeight = 100;
    const columns = 3;
    const rows = Math.ceil(totalMonths / columns);

    canvas.width = columns * monthWidth + padding * 2;
    canvas.height = rows * monthHeight + headerHeight + padding * 2;

    // Set background
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw header
    drawHeader(ctx, canvas.width, headerHeight);

    // Draw months
    let currentDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        1
    );
    for (let i = 0; i < totalMonths; i++) {
        const x = padding + (i % columns) * monthWidth;
        const y =
            headerHeight + padding + Math.floor(i / columns) * monthHeight;

        drawMonth(ctx, currentDate, x, y, monthWidth, monthHeight, checkedDays);

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Convert canvas to image and trigger download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${currentGHP.name}_streak_calendar.png`;
    link.href = dataUrl;
    link.click();
}

function drawHeader(ctx, width, height) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw GHP name
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#8b5cf6";
    ctx.textAlign = "center";
    ctx.fillText(currentGHP.name, width / 2, height / 3);

    // Draw streak info
    ctx.font = "20px Arial";
    ctx.fillStyle = "#10b981";
    const streakText = `Current Streak: ${currentGHP.current_streak} days | Max Streak: ${currentGHP.max_streak} days`;
    ctx.fillText(streakText, width / 2, (height * 2) / 3);
}

function drawMonth(ctx, date, x, y, width, height, checkedDays) {
    // Draw month name and year
    ctx.fillStyle = "#8b5cf6";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        x + width / 2,
        y + 30
    );

    // Draw day names
    ctx.font = "14px Arial";
    ctx.fillStyle = "#9ca3af";
    dayNames.forEach((day, index) => {
        ctx.fillText(day, x + (index + 0.5) * (width / 7), y + 60);
    });

    // Draw days
    const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    for (let i = 1; i <= daysInMonth; i++) {
        const dayX = x + ((i + firstDay - 1) % 7) * (width / 7);
        const dayY =
            y + 90 + Math.floor((i + firstDay - 1) / 7) * ((height - 90) / 6);

        const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
        const isChecked = checkedDays.some(
            (d) =>
                d.getFullYear() === currentDate.getFullYear() &&
                d.getMonth() === currentDate.getMonth() &&
                d.getDate() === currentDate.getDate()
        );

        // Draw day circle
        ctx.beginPath();
        ctx.arc(
            dayX + width / 14,
            dayY + (height - 90) / 12,
            (width / 7) * 0.35,
            0,
            Math.PI * 2
        );

        if (isChecked) {
            ctx.fillStyle = "#10b981";
            ctx.fill();
            ctx.fillStyle = "#ffffff";
        } else {
            ctx.fillStyle = "#6b7280";
        }

        // Draw day number
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            i.toString(),
            dayX + width / 14,
            dayY + (height - 90) / 12
        );
    }
}

sidebarButton.addEventListener("click", () => {
    toggleGHPSidebar();
});

addGHPButton.addEventListener("click", async () => {
    if (ghpInput.value.trim()) {
        addGHPButton.setAttribute("disabled", true);

        const newGHP = await addGHP(ghpInput.value.trim());
        setCurrentGHP(newGHP.id);
        updateGhpInfoUI(newGHP);
        updateTotalGhpChecked(getTotalGhpChecked(), ghpList.length);
        ghpInput.value = "";
        const ghpButton = createGHPButton(newGHP);
        ghpSidebar.appendChild(ghpButton);

        addGHPButton.removeAttribute("disabled");
    }
});

resetCalenderButton.addEventListener("click", (e) => {
    resetCalendar();
});

downloadCalenderButton.addEventListener("click", () => {
    if (currentGHP.checked_days.length === 0) {
        alert("You don't have any streak yet!");
        return;
    }
    downloadStreakCalendar();
});

addNoteModal.querySelector(".close").addEventListener("click", () => {
    addNoteModal.style.display = "none";
});

viewNoteModal.querySelector(".close").addEventListener("click", () => {
    viewNoteModal.style.display = "none";
});

addNoteModal.querySelector("#addNote").addEventListener("click", async (e) => {
    const htmlContent = quill.root.innerHTML;

    e.target.disabled = true;
    await addTodaysNotes(
        currentGHP.id,
        htmlContent,
        !isTodayChecked(),
        userData.todays_notes[currentGHP.name] !== null
    );
    addNoteModal.style.display = "none";
    e.target.disabled = false;

    setCurrentGHP(currentGHP.id);
    updateTodaysNotesButton();
});

function logout() {
    localStorage.removeItem("jwt_token");

    window.location.href = "";
}

logoutButton.addEventListener("click", (e) => {
    logout();
});

document.addEventListener("DOMContentLoaded", async () => {
    // Check if user is logged in
    const isLoggedIn = await verifyUserLogin();
    if (!isLoggedIn) {
        window.location.href = "login.html";
    }

    // Fetch all user data
    userData = await fetchUserData();
    if (!userData) {
        console.error("Failed to fetch user data");
        return;
    }

    updateGHPList();
    populateSidebar();

    // Update button status after buttons are created
    ghpList.forEach((ghp) => updateGHPButtonStatus(ghp.id));

    updateTotalGhpChecked(getTotalGhpChecked(), ghpList.length);

    quill = new Quill("#editor", {
        theme: "snow",
    });

    // If there's at least one GHP, set it as current (default)
    if (ghpList.length > 0) {
        // setCurrentGHP(ghpList[0].id);
        // updateGhpInfoUI(ghpList[0]);
        // document.querySelector(".ghp-button").classList.add("active");
    } else {
        updateCalendar(); // This will show the message to create a GHP
    }
});
