const searchURL = 'https://statsapi.web.nhl.com/api/v1/';
const TEAMS = [];
const GAMES = {};
let activeGAME = '';

function pageSetup() {     
    getTeams();
    watchPage();
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
            displayError(err.message); 
        });
}

function createTeamList(responseJson) {    
    for (let team in responseJson.teams) {        
        TEAMS.push({
            id: responseJson.teams[team].id, 
            city: responseJson.teams[team].locationName.toLowerCase(), 
            name: responseJson.teams[team].teamName.toLowerCase(),
            fullName: responseJson.teams[team].locationName+ " " + responseJson.teams[team].teamName,
            abbreviation: responseJson.teams[team].abbreviation
        })
    };     
}

function watchPage() {
    $('.search-form').on('submit', trackTeam );
    $('section').on('click', '.singleGame', detectLineScore );
    $('section').on('click', '.lineScore', closeLineScore ); 
}

async function trackTeam() {
    event.preventDefault();

    clearErrorDisplay();
    clearResults();
    clearGames();
    activeGAME = '';

    let teamID = findTeamID();    
    if (teamID) {
        await Promise.all([
            getPreviousGameResults(teamID),
            getUpcomingGameSchedule(teamID)
        ])
        displayPage();
        goToGames();
    }

    
}

function findTeamID() {        
    const searchTeam = TEAMS.find(x => x.name === $('#team').val().toLowerCase());
    if (!searchTeam) { 
        let errorText = `${$('#team').val()} is not a recognized NHL team. Please try again`;                
        displayError(errorText);
    } else {
        return searchTeam.id;
    }          
}

function getPreviousGameResults(teamID) {    
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = yesterday.toISOString().slice(0, 10);    

    const params = {
        teamId: teamID,
        endDate: yesterday,
        startDate: '2019-04-01',
    };

    const queryString = formatQueryParams(params);
    const url = searchURL + '/schedule/?' + queryString;

    return fetch(url)
        .then(response => {
            if (response.ok) {
                let j = response.json();
                console.log(j);
                return j; //response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => getRecentGames(responseJson))
        .catch(err => {
            displayError(err.message);
        });
}

function getUpcomingGameSchedule(teamID) {
    let today = new Date().toISOString().slice(0, 10);
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    endDate = endDate.toISOString().slice(0, 10);
    
    const params = {
        teamId: teamID,
        endDate: endDate,
        startDate: today,
    };

    const queryString = formatQueryParams(params);
    const url = searchURL + '/schedule/?' + queryString;

    return fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => getUpcomingGames(responseJson))
        .catch(err => {
            displayError(err.message);
        });

}

function formatQueryParams(params) {
    queryItems = Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function getRecentGames(previousGames) {
    let gameArray = [];
    for (let i = 1; i < 4; i++) {
        let game = previousGames.dates[previousGames.dates.length - i];
        let whoWon = (game.games[0].teams.away.score > game.games[0].teams.home.score)
            ? 'away'
            : 'home';
        
            gameArray.push({
            game: game.games[0].gamePk.toString(),
            date: game.date,
            away: {
                team: game.games[0].teams.away.team.name,
                score: game.games[0].teams.away.score,
                winner: (whoWon === 'away') ? 'winner' : 'loser',           
            },
            home: {
                team: game.games[0].teams.home.team.name,                
                score: game.games[0].teams.home.score,
                winner: (whoWon === 'home') ? 'winner' : 'loser',                           
            },             
        })
        GAMES.previous = gameArray;        
    }
}

function getUpcomingGames(upcomingGames) {
    let gameArray = [];
    for (let i = 0; i < 3; i++) {
        let game = upcomingGames.dates[i]
        gameArray.push({
            game: game.games[0].gamePk,
            date: game.date,
            away: game.games[0].teams.away.team.name,
            home: game.games[0].teams.home.team.name,
        })
    }
    GAMES.upcoming = gameArray;
}

async function detectLineScore(event) {
    let thisGame = $(event.currentTarget).attr('data-gameID')    
    if (thisGame !== activeGAME) {
        activeGAME = thisGame;
        await Promise.all([getLineScore()]);
    }

    displayPage();         
}

function closeLineScore() {
    activeGAME = '';
    displayPage();    
}

function clearResults() {
    $('.previous-container').empty();
    $('.upcoming-container').empty();
}

function clearGames() {    
    Object.keys(GAMES).forEach(x => delete GAMES[x]) 
}

function clearErrorDisplay() {
    $('.status-container').empty();
}

function displayError(errorText) {
    let statusHTML = `
        <h2>Error</h2>
        <p class="error">${errorText}</p>
        `;
    $('.status-container').html(statusHTML);
    goToSearch();
}

function getLineScore() {    
    const url = `${searchURL}/game/${activeGAME}/linescore`;

    return fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => saveLineScore(responseJson)) 
        .catch(err => displayError(err.message));        
} 

function saveLineScore(lineScore) {
    GAMES.previous.find(x => x.game === activeGAME).lineScore = lineScore;
}

function displayLineScore() {    
    let totalHTML = '';
    let awayFinalHTML = '';
    let homeFinalHTML = '';
    let sectionHTML = '';
    let gameStatus = '';
    let ls = GAMES.previous.find(x => x.game === activeGAME).lineScore
    let homeAbbreviation = '';
    let awayAbbreviation = '';
    
   
    //test for team in team list to enable creating abbreviation for international teams that aren't in team list
    if (TEAMS.find(x => x.fullName === ls.teams.away.team.name) === false) {
        let initials = ls.teams.away.team.name.match(/\b(\w)/g);
        let awayAbbreviation = initials.join('');        
    } else {
        awayAbbreviation = TEAMS.find(x => x.fullName === ls.teams.away.team.name).abbreviation
    };

    if (TEAMS.find(x => x.fullName === ls.teams.home.team.name) === undefined) {
        let initials = ls.teams.home.team.name.match(/\b(\w)/g);
        homeAbbreviation = initials.join('');        
    } else {
        homeAbbreviation = TEAMS.find(x => x.fullName === ls.teams.home.team.name).abbreviation
    }

    

    if (ls.currentPeriod < 4) {
        gameStatus = ls.currentPeriodTimeRemaining;
        totalHTML = '<li class="period">Total</li>';
        awayFinalHTML = `<li class="period total">${ls.teams.away.goals}</li>`
        homeFinalHTML = `<li class="period total">${ls.teams.home.goals}</li>`
    } else {
        gameStatus = `Final/${ls.currentPeriodOrdinal}`;
        totalHTML = `
            <li class="period">${ls.currentPeriodOrdinal}</li>
            <li class="period">Total</li>
            `
        if (ls.currentPeriod < 5) {
            awayFinalHTML = `
                <li class="period overTime">${ls.periods[3].away.goals}</li>
                <li class="period total">${ls.teams.away.goals}</li>
            `;
            homeFinalHTML = `
            <li class="period overTime">${ls.periods[3].home.goals}</li>
            <li class="period total">${ls.teams.home.goals}</li>
            `;
        } else {
            awayFinalHTML = `
                <li class="period overTime">(${ls.shootoutInfo.away.scores}-${ls.shootoutInfo.away.attempts})</li>
                <li class="period total">${ls.teams.away.goals}</li>
            `;
            homeFinalHTML = `
            <li class="period overTime">(${ls.shootoutInfo.home.scores}-${ls.shootoutInfo.home.attempts})</li>
            <li class="period total">${ls.teams.home.goals}</li>
            `;
        }
    } 

    sectionHTML = `        
    <button class="lineScore container" data-gameID="${activeGAME}">    
        <ul class="lineScore-header flex">
            <li class="gameStatus">${gameStatus}</li>
            <li class="period">1</li>
            <li class="period">2</li>
            <li class="period">3</li>
            ${totalHTML}
        </ul>
        <hr class="header-line">
        <div class="lineScore-container">
            <ul class="lineScore-away ${GAMES.previous.find(x => x.game === activeGAME).away.winner} flex">
                <li class="team">${awayAbbreviation}</li>
                <li class="period">${ls.periods[0].away.goals}</li>
                <li class="period">${ls.periods[1].away.goals}</li>
                <li class="period">${ls.periods[2].away.goals}</li>                        
                ${awayFinalHTML}
            </ul>          
            <hr class="team-line">
            <ul class="lineScore-home ${GAMES.previous.find(x => x.game === activeGAME).home.winner} flex">
                <li class="team">${homeAbbreviation}</li>
                <li class="period">${ls.periods[0].home.goals}</li>
                <li class="period">${ls.periods[1].home.goals}</li>
                <li class="period">${ls.periods[2].home.goals}</li>                    
                ${homeFinalHTML}
            </ul>                    
        </div>
    </button>
        
    `
    return sectionHTML;
}

function goToGames() {
    $('html, body').animate({
        scrollTop: $('.previous-container').offset().top
    }, 400);
}

function goToSearch() {
    $('html, body').animate({
        scrollTop: $('.search-container').offset().top
    }, 400);
}

function displayPage() {
    
    let gameHTML = '';
    let sectionHTML = `
        <h2>Previous Game Results</h2>
        <p class="instruction">Click on any game to see line score</p>
        <hr class="header-line">
    `;
    
    for (let game in GAMES.previous) {        
        if (activeGAME == GAMES.previous[game].game) {
            gameHTML = displayLineScore();            
        } else {
            gameHTML = createPreviousGameHTML(game);
        }
        sectionHTML += gameHTML
    };
    
    $('.previous-container').html(sectionHTML);       

    sectionHTML = `
        <h2>Upcoming Game Schedule</h2>
        <hr class="header-line">
        `;    
    
    for (let game in GAMES.upcoming) {
        gameHTML = createUpcomingGameHTML(game);
        sectionHTML += gameHTML
    };    
    
    $('.upcoming-container').html(sectionHTML);
}

function createPreviousGameHTML(game) {
    let gameHTML = `
    <button class="singleGame container animation" data-gameID="${GAMES.previous[game].game}">
        <ul class="game-list">    
            <li class="date">${GAMES.previous[game].date}</li>
            <li class="away ${GAMES.previous[game].away.winner}">${GAMES.previous[game].away.team}  ${GAMES.previous[game].away.score}</li>
            <li class="vs">@</li>
            <li class="home ${GAMES.previous[game].home.winner}">${GAMES.previous[game].home.team}  ${GAMES.previous[game].home.score}</li>
        </ul>
    </button>            
`
return gameHTML;
}

function createUpcomingGameHTML(game) {
    let gameHTML = `
                <div class="futureGame container" data-gameID="${GAMES.upcoming[game].game}">
                    <ul class="game-list">    
                        <li class="date">${GAMES.upcoming[game].date}</li>
                        <li class="away">${GAMES.upcoming[game].away}</li>
                        <li class="vs">@</li>
                        <li class="home">${GAMES.upcoming[game].home}</li>
                    </ul>
                </div>            
                `;
    return gameHTML;
}

$(pageSetup);