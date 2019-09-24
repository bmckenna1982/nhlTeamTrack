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
        <h3>Error</h3>
        <p class="error">${errorText}</p>
        `;
    $('.status-container').html(statusHTML);    
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
            // winner: function() {
            //     if (this.away.score > this.home.score) {
            //         return this.away.team;
            //     } else {
            //         return this.home.team;
            //     };
            // } 
        })
    }
    // determineWinner();
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
        <h3>Previous Game Results</h3>
        <hr class="header-line">
    `;

    console.log(GAMES);
    for (let x in GAMES) {
        let gameHTML = `
            <div class="singleGame container" data-gameID="${GAMES[x].game}">
                <div class="date">${GAMES[x].date}</div>
                <div class="away ${GAMES[x].away.winner}">${GAMES[x].away.team}  ${GAMES[x].away.score}</div>
                <div class="vs">@</div>
                <div class="home ${GAMES[x].home.winner}">${GAMES[x].home.team}  ${GAMES[x].home.score}</div>
            </div>
            <hr class="game-line">
        `
        sectionHTML += gameHTML
    };

        // for (let i = 1; i < 4;  i++) {
    //     let gameHTML = `
    //         <div class="singleGame container" data-gameID="${previousGames.dates[previousGames.dates.length - i].games[0].gamePk}">
    //         <div class="date">${previousGames.dates[previousGames.dates.length - i].date}</div>    
    //         <div class="away">${previousGames.dates[previousGames.dates.length - i].games[0].teams.away.team.name}  ${previousGames.dates[previousGames.dates.length - i].games[0].teams.away.score}</div>
    //             <div class="vs">@</div>
    //             <div class="home">${previousGames.dates[previousGames.dates.length - i].games[0].teams.home.team.name}  ${previousGames.dates[previousGames.dates.length - i].games[0].teams.home.score}</div>
    //         </div>
    //         <hr class="game-line">
    //         `
    //     sectionHTML += gameHTML
    // };

    $('.previous-container').html(sectionHTML);   
    goToGames(); 
}



function displayUpcomingGames(upcomingGames) {
    let sectionHTML = `
        <h3>Upcoming Game Schedule</h3>
        <hr class="header-line">
        `;    

    for (let i = 0; i < 3;  i++) {
        let gameHTML = `
            <div class="futureGame container" data-gameID="${upcomingGames.dates[i].games[0].gamePk}">
                <div class="date">${upcomingGames.dates[i].date}</div>
                <div class="away">${upcomingGames.dates[i].games[0].teams.away.team.name}</div>
                <div class="vs">@</div>
                <div class="home">${upcomingGames.dates[i].games[0].teams.home.team.name}</div>
            </div>
            <hr class="game-line">
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
    console.log(typeof(gameID));
    let winner = GAMES.find(x => x.game === gameID).away.winner
    

    if (lineScore.currentPeriod < 4) {
        gameStatus = lineScore.currentPeriodTimeRemaining;
        totalHTML = '<div class="period">Total</div>';
        awayFinalHTML = `<div class="period total">${lineScore.teams.away.goals}</div>`
        homeFinalHTML = `<div class="period total">${lineScore.teams.home.goals}</div>`
    } else {
        gameStatus = `Final/${lineScore.currentPeriodOrdinal}`;
        totalHTML = `
            <div class="period">${lineScore.currentPeriodOrdinal}</div>
            <div class="period">Total</div>
            `
        if (lineScore.currentPeriod < 5) {
            awayFinalHTML = `
                <div class="period overTime">${lineScore.periods[3].away.goals}</div>
                <div class="period total">${lineScore.teams.away.goals}</div>
            `;
            homeFinalHTML = `
            <div class="period overTime">${lineScore.periods[3].home.goals}</div>
            <div class="period total">${lineScore.teams.home.goals}</div>
            `;
        } else {
            awayFinalHTML = `
                <div class="period overTime">(${lineScore.shootoutInfo.away.scores}-${lineScore.shootoutInfo.away.attempts})</div>
                <div class="period total">${lineScore.teams.away.goals}</div>
            `;
            homeFinalHTML = `
            <div class="period overTime">(${lineScore.shootoutInfo.home.scores}-${lineScore.shootoutInfo.home.attempts})</div>
            <div class="period total">${lineScore.teams.home.goals}</div>
            `;
        }
    } 

    sectionHTML = `        
        <div class="lineScore-header flex">
            <div class="gameStatus">${gameStatus}</div>
            <div class="period">1</div>
            <div class="period">2</div>
            <div class="period">3</div>
            ${totalHTML}
        </div>
        <hr class="header-line">
        <div class="lineScore-container">
            <div class="lineScore-away ${GAMES.find(x => x.game === gameID).away.winner} flex">
                <div class="team">${lineScore.teams.away.team.name}</div>
                <div class="period">${lineScore.periods[0].away.goals}</div>
                <div class="period">${lineScore.periods[1].away.goals}</div>
                <div class="period">${lineScore.periods[2].away.goals}</div>                        
                ${awayFinalHTML}
            </div>
        </div>  
        <hr class="team-line">
            <div class="lineScore-home ${GAMES.find(x => x.game === gameID).home.winner} flex">
                <div class="team">${lineScore.teams.home.team.name}</div>
                <div class="period">${lineScore.periods[0].home.goals}</div>
                <div class="period">${lineScore.periods[1].home.goals}</div>
                <div class="period">${lineScore.periods[2].home.goals}</div>                    
                ${homeFinalHTML}
            </div>                    
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

$(pageSetup);