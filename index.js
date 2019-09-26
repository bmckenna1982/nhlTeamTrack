const searchURL = 'https://statsapi.web.nhl.com/api/v1/';
const TEAMS = [];
const GAMES = [];
const scoreReturn = {};

function pageSetup() {
    //call API and build team ID object    
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
    $('section').on('click', '.singleGame', detectLineScore ) 
}

function trackTeam() {
    event.preventDefault();

    clearErrorDisplay();
    clearResults();
    clearGames();

    let teamID = findTeamID();    
    if (teamID) {
        getPreviousGameResults(teamID);
        getUpcomingGameSchedule(teamID);
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

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => displayRecentGames(responseJson))
        .catch(err => {
            displayError(err.message);
        });
}

function clearGames() {
    GAMES.length = 0;
}

function clearScoreReturn() {
    Object.keys(scoreReturn).forEach(x => delete scoreReturn[x])
}

function formatQueryParams(params) {
    queryItems = Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function clearResults() {
    $('.previous-container').empty();
    $('.upcoming-container').empty();
}

function clearErrorDisplay() {
    $('.status-container').empty();
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

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => displayUpcomingGames(responseJson))
        .catch(err => {
            displayError(err.message);
        });

}

function getRecordOfTeam() {
    //use to display team and record in status container while results load
}

function displayLoadingTeam() {
    //show loading animation while fetch occurs

}

function displayError(errorText) {
    let statusHTML = `
        <h2>Error</h2>
        <p class="error">${errorText}</p>
        `;
    $('.status-container').html(statusHTML);
    goToSearch();
}

function getRecentGames(previousGames) {
    for (let i = 1; i < 4; i++) {
        let game = previousGames.dates[previousGames.dates.length - i];
        let whoWon = (game.games[0].teams.away.score > game.games[0].teams.home.score)
            ? 'away'
            : 'home';
        GAMES.push({
            game: game.games[0].gamePk.toString(),
            date: game.date,
            away: {
                team: game.games[0].teams.away.team.name,
                abbreviation: TEAMS.find(x => x.fullName === game.games[0].teams.away.team.name).abbreviation,
                score: game.games[0].teams.away.score,
                winner: (whoWon === 'away') ? 'winner' : 'loser',           
            },
            home: {
                team: game.games[0].teams.home.team.name,
                score: game.games[0].teams.home.score,
                winner: (whoWon === 'home') ? 'winner' : 'loser',                           
            }, 
        })
    }    
}

function determineWinner() {
    for (let x in GAMES) {
        if(GAMES[x].away.score > GAMES[x].home.score) {
            GAMES[x].away.winner =  'winner';
            GAMES[x].home.winner =  'loser';
        } else {
            GAMES[x].home.winner = 'winner';
            GAMES[x].away.winner = 'loser';
        }
    }
}

function displayRecentGames(previousGames) {
    getRecentGames(previousGames);
    let sectionHTML = `
        <h2>Previous Game Results</h2>
        <p class="instruction">Click on any game to see line score</p>
        <hr class="header-line">
    `;
  
    for (let x in GAMES) {
        let gameHTML = `
            <button class="singleGame container" data-gameID="${GAMES[x].game}">
                <ul class="game-list">    
                    <li class="date">${GAMES[x].date}</li>
                    <li class="away ${GAMES[x].away.winner}">${GAMES[x].away.team}  ${GAMES[x].away.score}</li>
                    <li class="vs">@</li>
                    <li class="home ${GAMES[x].home.winner}">${GAMES[x].home.team}  ${GAMES[x].home.score}</li>
                </ul>
            </button>            
        `
        sectionHTML += gameHTML
    };

    $('.previous-container').html(sectionHTML);   
    goToGames(); 
}



function displayUpcomingGames(upcomingGames) {
    
    let sectionHTML = `
        <h2>Upcoming Game Schedule</h2>
        <hr class="header-line">
        `;    

    for (let i = 0; i < 3;  i++) {
        let gameHTML = `
            <div class="futureGame container" data-gameID="${upcomingGames.dates[i].games[0].gamePk}">
                <ul class="game-list">    
                    <li class="date">${upcomingGames.dates[i].date}</li>
                    <li class="away">${upcomingGames.dates[i].games[0].teams.away.team.name}</li>
                    <li class="vs">@</li>
                    <li class="home">${upcomingGames.dates[i].games[0].teams.home.team.name}</li>
                </ul>
            </div>            
            `
        sectionHTML += gameHTML
    };    
    
    $('.upcoming-container').html(sectionHTML);
}

function detectLineScore(event) {        
    if (Object.keys(scoreReturn).length > 1) {
        closeLineScore();
        
        if ($(event.currentTarget).attr('data-gameID') !== scoreReturn.gameID) {
            clearScoreReturn();    
            getLineScore(event);
        } else {
            clearScoreReturn();
        };    
    } else {
        getLineScore(event);
    }
}

function closeLineScore() {
    $(`[data-gameID="${scoreReturn.gameID}"]`).html(scoreReturn.gameHTML);
    $(`[data-gameID="${scoreReturn.gameID}"]`).removeClass('lineScore');
}

function getLineScore(event) {
    let gameID = $(event.currentTarget).attr('data-gameID')
    const url = `${searchURL}/game/${gameID}/linescore`;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => displayLineScore(responseJson, gameID))
        .catch(err => displayError(err.message));        
} 

function displayLineScore(lineScore, gameID) {
    scoreReturn.gameID = gameID;
    scoreReturn.gameHTML = $(`[data-gameID="${gameID}"]`).html();
    
    let totalHTML = '';
    let awayFinalHTML = '';
    let homeFinalHTML = '';
    let sectionHTML = '';
    let gameStatus = '';
    let abbreviation = TEAMS.find(x => x.fullName === lineScore.teams.away.team.name).abbreviation;    
    // let winner = GAMES.find(x => x.game === gameID).away.winner
    

    if (lineScore.currentPeriod < 4) {
        gameStatus = lineScore.currentPeriodTimeRemaining;
        totalHTML = '<li class="period">Total</li>';
        awayFinalHTML = `<li class="period total">${lineScore.teams.away.goals}</li>`
        homeFinalHTML = `<li class="period total">${lineScore.teams.home.goals}</li>`
    } else {
        gameStatus = `Final/${lineScore.currentPeriodOrdinal}`;
        totalHTML = `
            <li class="period">${lineScore.currentPeriodOrdinal}</li>
            <li class="period">Total</li>
            `
        if (lineScore.currentPeriod < 5) {
            awayFinalHTML = `
                <li class="period overTime">${lineScore.periods[3].away.goals}</li>
                <li class="period total">${lineScore.teams.away.goals}</li>
            `;
            homeFinalHTML = `
            <li class="period overTime">${lineScore.periods[3].home.goals}</li>
            <li class="period total">${lineScore.teams.home.goals}</li>
            `;
        } else {
            awayFinalHTML = `
                <li class="period overTime">(${lineScore.shootoutInfo.away.scores}-${lineScore.shootoutInfo.away.attempts})</li>
                <li class="period total">${lineScore.teams.away.goals}</li>
            `;
            homeFinalHTML = `
            <li class="period overTime">(${lineScore.shootoutInfo.home.scores}-${lineScore.shootoutInfo.home.attempts})</li>
            <li class="period total">${lineScore.teams.home.goals}</li>
            `;
        }
    } 

    sectionHTML = `        
        <ul class="lineScore-header flex">
            <li class="gameStatus">${gameStatus}</li>
            <li class="period">1</li>
            <li class="period">2</li>
            <li class="period">3</li>
            ${totalHTML}
        </ul>
        <hr class="header-line">
        <div class="lineScore-container">
            <ul class="lineScore-away ${GAMES.find(x => x.game === gameID).away.winner} flex">
                <li class="team">${TEAMS.find(x => x.fullName === lineScore.teams.away.team.name).abbreviation}</li>
                <li class="period">${lineScore.periods[0].away.goals}</li>
                <li class="period">${lineScore.periods[1].away.goals}</li>
                <li class="period">${lineScore.periods[2].away.goals}</li>                        
                ${awayFinalHTML}
            </ul>          
            <hr class="team-line">
            <ul class="lineScore-home ${GAMES.find(x => x.game === gameID).home.winner} flex">
                <li class="team">${TEAMS.find(x => x.fullName === lineScore.teams.home.team.name).abbreviation}</li>
                <li class="period">${lineScore.periods[0].home.goals}</li>
                <li class="period">${lineScore.periods[1].home.goals}</li>
                <li class="period">${lineScore.periods[2].home.goals}</li>                    
                ${homeFinalHTML}
            </ul>                    
        </div>        
    `
   $(`[data-gameID="${gameID}"]`).html(sectionHTML);
   $(`[data-gameID="${gameID}"]`).addClass('lineScore');    
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
    // if the gameID to display was clicked display line score
    // otherwise draw normal 
}


$(pageSetup);