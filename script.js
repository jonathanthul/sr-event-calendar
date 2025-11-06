// script.js

// -------------------------------
// Global state and DOM references
// -------------------------------
let normalEvents = []; // will hold normalized event data after loading
let currentYear = 2025;
let currentMonth = 10;
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const prevBtn = document.getElementById('prevButton');
const nextBtn = document.getElementById('nextButton');
const monthTitle = document.getElementById('month-title');
const grid = document.querySelector('.calendar-grid');
const header = document.querySelector('.calendar-header');
const eventModal = document.getElementById('event-detail-view');
const closeEventModalBtn = document.getElementById('close-event-modal');

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

    const firstDateOfMonth = new Date(year, month, 1);
    const lastDateOfMonth = new Date(year, month + 1, 0);
    
    // Determine Monday of first week
    const startDate = new Date(firstDateOfMonth); // create a copy of the startDate to loop over
    while (startDate.getDay() !== 1) { // .getDay returns day of the week starting at Sunday = 0. .getDate would return the actual day part of the date, i. e. 1-31
        startDate.setDate(startDate.getDate() - 1) // Take the current startDate, take its day component and subtract 1. Since this is a JS Date object, subtracting one automatically rolls over into previous month or year if needed. Then the startDate is set to that.
    }

    // Determine Sunday of last week
    const endDate = new Date(lastDateOfMonth);
    while (endDate.getDay() !== 0) {
        endDate.setDate(endDate.getDate() + 1)
    }

    // Generate one cell per day between startDate and endDate
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // console.log(d) // Test console print
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day-cell');

        dayDiv.textContent = d.getDate();
        dayDiv.dataset.date = d.toISOString().split('T')[0]; // what is going on here?

        // Initialize events container for later
        const eventsContainer = document.createElement('div');
        eventsContainer.classList.add('events');
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
        const eventDateString = event.datetime.toISOString().split('T')[0];
        const dayCell = document.querySelector(`.day-cell[data-date='${eventDateString}']`);
        if (dayCell) {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event');
            eventDiv.textContent = event.homeTeam.abbr + " vs " + event.awayTeam.abbr;
            eventDiv.addEventListener('click', () => openEventDetail(event));
            dayCell.querySelector('.events').appendChild(eventDiv);
        }
    });
}

// ----------------------------
// Event detail modal functions
// ----------------------------
function openEventDetail(event) {
    // Fill in the info
    document.getElementById('event-date').textContent = event.datetime.toLocaleString();
    document.getElementById('event-title').textContent = `${event.homeTeam.name} vs ${event.awayTeam.name}`;
    document.getElementById('event-result').textContent = (event.result.homeGoals !== null && event.result.awayGoals !== null) ? `${event.result.homeGoals} : ${event.result.awayGoals}` : '- : -';
    document.getElementById('event-competition').textContent = event.competition ? event.competition : '';
    document.getElementById('event-sport').textContent = event.competition ? event.sport : '';

    // Reveal modal
    eventModal.classList.remove('hidden');
}

// -----------------------
// Data handling functions
// -----------------------

// normalize event objects. Combines date and time into a single JS Date object, provides fallback values for missing data
function normalizeEvent(rawEvent) {
    const dateStr = rawEvent.dateVenue;
    const timeStr = rawEvent.timeVenueUTC;

    // convert dateStr and timeStr into ISO 8601 timestamp. T is required by the standard, Z is a shorthand for UTC timezone
    // then apply Date to parse
    const datetime = dateStr && timeStr ? new Date(`${dateStr}T${timeStr}Z`) : null;

    return {
        datetime,
        sport: rawEvent.sport ?? null,
        competition: rawEvent.originCompetitionName ?? null,
        homeTeam: {
            name: rawEvent.homeTeam?.officialName ?? 'TBA',
            abbr: rawEvent.homeTeam?.abbreviation ?? 'TBA',
            country: rawEvent.homeTeam?.teamCountryCode ?? 'TBA',
        }, 
        awayTeam: {
            name: rawEvent.awayTeam?.officialName ?? 'TBA',
            abbr: rawEvent.awayTeam?.abbreviation ?? 'TBA',
            country: rawEvent.awayTeam?.teamCountryCode ?? 'TBA',

        },
        result: {
            homeGoals: rawEvent.result?.homeGoals ?? null,
            awayGoals: rawEvent.result?.awayGoals ?? null,
        }
    }
}

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

// ---------------
// Event listeners
// ---------------
prevBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
    renderEvents(normalEvents);
});

nextBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
    renderEvents(normalEvents);
});

closeEventModalBtn.addEventListener('click', () => {eventModal.classList.add('hidden')});
eventModal.addEventListener('click',(e) => {
    if (e.target === eventModal) {
        eventModal.classList.add('hidden');
    }
});

// --------------
// Initialization
// --------------
async function init() {
    normalEvents = await loadEvents();

    renderDayNames();
    renderCalendar(currentYear, currentMonth);
    renderEvents(normalEvents);
}

init();