// script.js
// fetches event data from data/events.json, normalizes it and stores it in normalEvents

let normalEvents = [];

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

// asynchronously fetch data from the events.json file, normalize each event, return array of structured event objects
// if the fetch fails, log error and return empty array
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

// wait for loadEvents() promise to resolve, then store event data in normalEvents and print to console for checking
loadEvents().then(events => {
    normalEvents = events;
    console.log(normalEvents)
})