// script.js
// fetches event data from data/events.json, normalizes it and stores it in normalEvents

// will hold normalized event data after loading
let normalEvents = [];

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

// load events and store them for later, print them for testing
loadEvents().then(events => {
    normalEvents = events;
    console.log(normalEvents)
})

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Render weekday labels according to dayNames
function renderDayNames() {
    const header = document.querySelector('.calendar-header');
    dayNames.forEach(day => {
        const div = document.createElement('div');
        div.textContent = day;
        header.appendChild(div);
    });
}

renderDayNames();

function renderCalendar(year, month) {
    const grid = document.querySelector('.calendar-grid');
    grid.innerHTML = ''; // clears previous month

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
        
        // Highlight today's date
        if (d.toDateString() === new Date().toDateString()) {
            dayDiv.classList.add('day-today');
        }

        grid.appendChild(dayDiv);
    }
}

renderCalendar(2025, 10);