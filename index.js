const searchURL = 'https://statsapi.web.nhl.com/api/v1/';
const TEAMS = [];

function pageSetup() {
    //call API and build team ID object
    getTeams();
    watchForm();
}

function getTeams() {
    fetch(`${searchURL}/teams`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => createTeamList(responseJson))
        .catch(err => {
            $('.error').text(`Something went wrong: ${err.message}`);
        });
}

function createTeamList(responseJson) {
    console.log(responseJson.teams[1])
    for (let team in responseJson.teams) {        
        TEAMS.push({id: responseJson.teams[team].id, city: responseJson.teams[team].locationName.toLowerCase(), name: responseJson.teams[team].teamName.toLowerCase()})
    }; 
    console.log(TEAMS);
}

function watchForm() {
    $('.search-form').on('submit', trackTeam );
    console.log('watchForm ran');

}

function trackTeam() {
    let teamID = findTeamID();
    console.log(teamID);
    getPreviousGameResults(teamID);
}

function findTeamID() {        
    const searchTeam = TEAMS.find(x => x.name === $('#team').val().toLowerCase());
    return searchTeam.id;
    
}

// function findTeam(teamID) {
    
//     event.preventDefault();
    
//     fetch(`${searchURL}/teams/${teamID}`)
//         .then(response => {
//             if (response.ok) {
//                 return response.json();
//             }
//             throw new Error(response.statusText);
//         })
//         .then(responseJson =>  getPreviousGameResults(responseJson))
//         .catch(err => displayError());
// }

function getPreviousGameResults(teamID) {
    let today = new Date();
    today.setDate(today.getDate() - 1);
    let endDate = today.toISOString().slice(0, 10);    
    
    const params = {
        teamId: teamID,
        endDate: endDate,
        startDate: '2019-04-01',
    };

    const queryString = formatQueryParams(params);
    const url = searchURL + '/schedule/?' + queryString;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => displayRecentGames(responseJson))
        .catch(err => {console.log(err.message);
        });
}

function formatQueryParams(params) {
    queryItems = Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}


function chooseStartDate() {
    // let startDate = 
} 

function displayLoadingTeam() {
    //show loading animation while fetch occurs

}

function displayError(errorText) {

}

function displayTeam() {
    
}

function displayRecentGames(previousGames) {
    // console.log(previousGames.dates[0].games[0].teams.away.team.name)
    for (let i = 1; i < 4;  i++) {
        console.log(previousGames.dates[previousGames.dates.length - i].games[0].teams.away.team.name);
        let sectionHTML = `
    <div class="singleGame container">
        <div class="away">${previousGames.dates[previousGames.dates.length - i].games[0].teams.away.team.name}& score</div>
        <div class="vs">VS</div>
        <div class="home">Home Team Name & score</div>
    </div>`
    }
    
}

function displayUpcomingGames() {

}

$(pageSetup);