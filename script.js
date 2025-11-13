// script.js

// -------------------------------
// Global state and DOM references
// -------------------------------
let currentDate = new Date();
let normalEvents = [];
let userEvents = [];
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const todayBtn = document.getElementById('todayButton');
const prevBtn = document.getElementById('prevButton');
const nextBtn = document.getElementById('nextButton');
const createBtn = document.getElementById('createButton');
const monthTitle = document.getElementById('month-title');
const grid = document.querySelector('.calendar-grid');
const header = document.querySelector('.calendar-header');

const eventModal = document.getElementById('event-detail-view');
const createModal = document.getElementById('event-create-view');
const closeModalBtns = document.querySelectorAll('.modal-close');
const eventSaveBtn = document.getElementById('event-input-save');

const sportInput = document.getElementById('event-select-sport');
const nameInput = document.getElementById('event-input-name');
const nameLabel = document.getElementById('event-input-name-label');
const matchInput = document.getElementById('event-input-match');
const hometeamInput = document.getElementById('event-input-hometeam');
const hometeamLabel = document.getElementById('event-input-hometeam-label');
const awayteamInput = document.getElementById('event-input-awayteam');
const awayteamLabel = document.getElementById('event-input-awayteam-label');
const datetimeInput = document.getElementById('event-input-datetime');
const competitionInput = document.getElementById('event-input-competition');

// ----------------------------
// Calendar rendering functions
// ----------------------------

// Render weekday labels according to dayNames
function renderDayNames() {
    dayNames.forEach(day => {
        const div = document.createElement('div');
        div.textContent = day;
        header.appendChild(div);
    });
}

function renderCalendar(year, month) {
    grid.innerHTML = ''; // clears previous month
    monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDateOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDateOfMonth = new Date(Date.UTC(year, month + 1, 0));
    
    // Determine Monday of first week
    const startDate = new Date(firstDateOfMonth); // create a copy of the startDate to loop over
    while (startDate.getUTCDay() !== 1) { // .getDay returns day of the week starting at Sunday = 0. .getDate would return the actual day part of the date, i. e. 1-31
        startDate.setUTCDate(startDate.getUTCDate() - 1) // Take the current startDate, take its day component and subtract 1. Since this is a JS Date object, subtracting one automatically rolls over into previous month or year if needed. Then the startDate is set to that.
    }

    // Determine Sunday of last week
    const endDate = new Date(lastDateOfMonth);
    while (endDate.getUTCDay() !== 0) {
        endDate.setUTCDate(endDate.getUTCDate() + 1)
    }

    // Generate one cell per day between startDate and endDate
    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
        const clickDate = new Date(d); // store the current step of the loop for event listener creation down the line. Otherwise you get weird results

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day-cell');
        dayDiv.setAttribute('title', 'Add event');

        dayDiv.textContent = clickDate.getUTCDate();
        // toISOString will return the wrong date: Say you're on November 1st. Then new Date (November 1 2025) will return the timestamp for midnight of November 1st 2025 in the local timezone, i. e. NOT UTC but GMT+0100 in your case. Then .toISOString() converts the date into UTC which (since you're operating with midnight) becomes "2025-10-31T23:00:00.000Z", i. e. October 31st 2025 23:00.
        // FIXED: By using the UTC date for startDate and endDate, this issue doesn't arise
        dayDiv.dataset.date = clickDate.toISOString().split('T')[0];

        // Initialize events container for later
        const eventsContainer = document.createElement('div');
        eventsContainer.classList.add('events');
        eventsContainer.addEventListener('click', (e) => {
            if (e.target === eventsContainer) {
                openEventCreate(clickDate);
            }
        });
        dayDiv.appendChild(eventsContainer);
        
        // Highlight today's date
        if (d.toDateString() === new Date().toDateString()) {
            dayDiv.classList.add('day-today');
        }

        grid.appendChild(dayDiv);
    }
}

// loop through all events and add event containers in the correct day cells
function renderEvents(events) {
    events.forEach(event => {
        // convert UTC time into ms since epoch, subtract timeshift between UTC and local timezone in ms, convert that back to UTC and take the date portion for div matching
        // subtract because getTimezoneOffset() returns a negative value for UTC+n with positive n
        const eventLocalDateString = new Date(event.datetime.getTime() - (event.datetime.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const dayCell = document.querySelector(`.day-cell[data-date='${eventLocalDateString}']`); // look for "2025-11-03"
        if (dayCell) {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event');
            eventDiv.setAttribute('title', 'See event details');
            if (event.source == 'user') {eventDiv.classList.add('user')};
            eventDiv.textContent = event.name
                ? event.name
                : (event.homeTeam.name || 'TBA') + " vs " + (event.awayTeam.name || 'TBA');
            eventDiv.addEventListener('click', () => openEventDetail(event));
            dayCell.querySelector('.events').appendChild(eventDiv);
        }
    });
}

function refreshCalendar(year = currentYear, month = currentMonth) {
    renderCalendar(year, month);
    renderEvents(normalEvents);
    renderEvents(userEvents);
};

function resetCreateEvent() {
    nameInput.value = '';
    hometeamInput.value = '';
    awayteamInput.value = '';
    sportInput.value = '';
    competitionInput.value = '';
    datetimeInput.value = '';
    matchInput.checked = false;

    nameLabel.classList.remove('hidden');
    nameLabel.setAttribute('required', '');
    hometeamLabel.classList.add('hidden');
    hometeamInput.removeAttribute('required');
    awayteamLabel.classList.add('hidden');
    awayteamInput.removeAttribute('required');
};

// ----------------------------
// Modal functions
// ----------------------------
function openEventDetail(event) {
    datetimeOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    };

    // Fill in the info
    document.getElementById('event-date').textContent = event.datetime.toLocaleString("en-GB", datetimeOptions);
    document.getElementById('event-title').textContent = event.name
        ? event.name
        : (event.homeTeam.name || 'TBA') + " vs " + (event.awayTeam.name || 'TBA');
    if (event.result) {document.getElementById('event-result').textContent = (event.result.homeGoals !== null && event.result.awayGoals !== null) ? `${event.result.homeGoals} : ${event.result.awayGoals}` : '- : -'};
    document.getElementById('event-competition').textContent = event.competition ? event.competition : '';
    document.getElementById('event-sport').textContent = event.sport ? event.sport : '';

    // Reveal modal
    eventModal.classList.remove('hidden');
}

function openEventCreate(date = null) {
    resetCreateEvent();
    const datetimeInput = document.getElementById('event-input-datetime');

    // Prefill datetime input if date is provided
    if (date !== null) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        datetimeInput.value = `${yyyy}-${mm}-${dd}T12:00`;
    };

    createModal.classList.remove('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
};

// -----------------------
// Data handling functions
// -----------------------

// fetch data from the events.json file, normalize each event, return array of structured event objects
// return [] if loading fails
async function loadEvents() {
    try {
        const response = await fetch('./data/events.json'); // await 
        const rawEvents = await response.json();
        
        return rawEvents.data.map(normalizeEvent);
    } catch (error) {
        console.error('Error loading events:', error)
        return [];
    }
}

function normalizeText(str) {
    if (!str) return null;
    const sportsAbbr = ["FC", "UEFA", "FIFA", "AC", "SC", "AFC", "CONCACAF", "CAF", "OFC", "CONMEBOL", "CECAFA", "UAFA", "UNAF"] // should be replaced by a more comprehensive list
    return str
        .trim()
        .split(' ')
        .map(term => sportsAbbr.includes(term) ? term : term[0].toUpperCase() + term.slice(1).toLowerCase())
        .join(' ');
}

// normalize event objects. Combines date and time into a single JS Date object, provides fallback values for missing data
function normalizeEvent(rawEvent) {
    const dateStr = rawEvent.dateVenue; // "2025-11-03"
    const timeStr = rawEvent.timeVenueUTC; // "16:00:00",

    // convert dateStr and timeStr into ISO 8601 timestamp. T is required by the standard, Z is a shorthand for UTC timezone
    // then apply Date to parse
    const datetime = dateStr && timeStr ? new Date(`${dateStr}T${timeStr}Z`) : null; // 1762185600000 (ms since Jan 1st 1970 UTC)

    return {
        source: 'system',
        datetime,
        sport: normalizeText(rawEvent.sport),
        competition: normalizeText(rawEvent.originCompetitionName) ?? null,
        homeTeam: {
            name: normalizeText(rawEvent.homeTeam?.officialName) ?? null,
            country: rawEvent.homeTeam?.teamCountryCode ?? null,
        }, 
        awayTeam: {
            name: normalizeText(rawEvent.awayTeam?.officialName) ?? null,
            country: rawEvent.awayTeam?.teamCountryCode ?? null,
        },
        name : null,
        result: {
            homeGoals: rawEvent.result?.homeGoals ?? null,
            awayGoals: rawEvent.result?.awayGoals ?? null,
        }
    }
}

// ---------------
// Event listeners
// ---------------
todayBtn.addEventListener('click', () => {
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    refreshCalendar();
});

prevBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    refreshCalendar();
});

nextBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    refreshCalendar();
});

// Event listener for modal close buttons
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});

// Add "outside clicks" event listener to modal views
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAllModals();
        }
    });
});

function updateEventInputs() {
    const sport = sportInput.value;

    teamsports = ['American Football', 'Baseball', 'Basketball', 'Cricket', 'Football', 'Ice hockey', 'Volleyball'];
    matchsports = ['Boxing', 'Tennis'];

    if (
        teamsports.includes(sport)
    ) 
    {
        console.log(`${sport} selected!`);
    };
};

sportInput.addEventListener('click', () => updateEventInputs());

createBtn.addEventListener('click', () => {openEventCreate();});

// Make "match" button in create modal modify input fields
document.getElementById('event-input-match').addEventListener('click', ()=> {
    nameLabel.classList.toggle('hidden');
    nameInput.toggleAttribute('required');

    hometeamLabel.classList.toggle('hidden');
    hometeamInput.toggleAttribute('required');

    awayteamLabel.classList.toggle('hidden');
    awayteamInput.toggleAttribute('required');
});

// save event data from for in userEvents
const eventCreateForm = document.getElementById('event-create-form');

eventCreateForm.addEventListener('submit', (e) => {
    e.preventDefault(); // stop the submit action from reloading the page

    // it should be okay to store the date as local time because you do .toISOString in renderEvents at that turns it into UTC (?)
    const datetime = new Date(datetimeInput.value);

    const isMatch = matchInput.checked;

    const event = {
        source: 'user',
        datetime,
        sport: normalizeText(sportInput.value) || null,
        competition: normalizeText(competitionInput.value) || null, // is this necessary?
        homeTeam: isMatch
            ? {
                    name: isMatch ? normalizeText(hometeamInput.value) : null,
                    abbr: null,
                    country: null
                }
            :   null,
        awayTeam: isMatch
            ? {
                name: isMatch ? normalizeText(awayteamInput.value) : null,
                abbr: null,
                country: null,
            }
            : null,
        name: isMatch ? null : normalizeText(nameInput.value),
        result: isMatch ? {homeGoals: null, awayGoals: null} : null,
    };

    userEvents.push(event);
    console.log('userEvents', userEvents);

    closeAllModals();
    refreshCalendar();
});


// --------------
// Initialization
// --------------
async function init() {
    normalEvents = await loadEvents();
    // sort the events by date so that renderEvents puts them in the right order
    normalEvents.sort((a,b) => (a.datetime - b.datetime));
    console.log(normalEvents);

    renderDayNames();
    refreshCalendar();
}

init();