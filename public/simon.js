/* global Vue */
/* global axios */

var afterPlaySeq = function(){
    game.startUserTurn()
}


var game = new Vue ({
    el: '#game',
    
    data: {
        apiUrl: "https://amj311-screen-slaver.herokuapp.com",
        gameName: "Screen Slaver",
        GAME_STATES: ["loading","login","menu","playing","lost","scores"],
        gameState: "loading",
        playerTurn: false,
        username: '',
        nameQuery: '',
        currentScore: 0,
        scoreInc: 25,
        userScores: [],
        highScores: [],
        maxScores: 25,
        simonMessage: "",
        simonSeq: [],
        simonSeqIdx: 0,
        ctDwn: 3,
        userAttempt: [],
        round: 0,
        playingColors: [],
        simonColor: null,
        showSimonColor: false,
        numColors: 6,
        simonSpeed: 1000,
        uiColors: {play: null, scores: null, submit: null, back: null},
        allColors: ["dodgerblue","lime","blueviolet","gold","red","darkorange","magenta"],
        screenBgURL: "images/static_fizzle.gif",
        bgURLS: {
            'static': "images/static_fizzle.gif",
            'error': "images/static_colors.gif",
            'hypno': "images/hypno.gif",
        },
        
    },
    
    async created() {
        this.gameState = this.GAME_STATES[0]
        this.uiColors.play = this.randomFrom(this.allColors)
        this.uiColors.scores = this.randomFrom(this.allColors)
        this.uiColors.submit = this.randomFrom(this.allColors)
        this.uiColors.back = this.randomFrom(this.allColors)
        
        let colorsLeft = Array.from(this.allColors)
        for (let i = 0; i < this.numColors; i++) {
            let idx = this.randomIdxOf(colorsLeft)
            this.playingColors.push(this.allColors.indexOf(colorsLeft[idx]))
            colorsLeft.splice(idx,1)
        }
        
        this.gameState = this.GAME_STATES[2]
    },
    
    watch: {
        gameState() {
            // LOADING
            if (this.gameState === this.GAME_STATES[0]){
                this.simonMessage = "";
                this.screenBgURL = this.bgURLS.error;
            }
            // LOGIN
            if (this.gameState === this.GAME_STATES[1]){
                this.simonMessage = "Welcome";
                this.screenBgURL = this.bgURLS.static;
            }
            // MAIN
            if (this.gameState === this.GAME_STATES[2]){
                this.simonMessage = this.gameName;
                this.screenBgURL = this.bgURLS.hypno;
            }
            // PLAYING
            if (this.gameState === this.GAME_STATES[3]){
                this.screenBgURL = this.bgURLS.static;
            }
            // GAME OVER
            if (this.gameState === this.GAME_STATES[4]){
                this.simonMessage = "Game Over";
                this.screenBgURL = this.bgURLS.error;
                
            }
            // SCORES
            if (this.gameState === this.GAME_STATES[5]){
                this.simonMessage = "High Scores";
                this.screenBgURL = this.bgURLS.static;
                this.getHighScores();
                this.getUserScores();
            }
        }
    },
    
    methods: {
        randomIdxOf(array){
            return Math.round(Math.random()*(array.length-1))
        },
        
        randomFrom(array){
            return array[Math.round(Math.random()*(array.length-1))]
        },
        
        abortToMenu() {
            this.gameState = this.GAME_STATES[2]
        },
        
        startGame(){
            this.currentScore = 0;
            this.gameState = this.GAME_STATES[3]
            this.playerTurn = false;
            this.simonSeq = []
            this.round = 0;
            
            this.startNextRound()
        },
        
        startNextRound() {
            this.showSimonColor = false;
            game.playerTurn = false;
            game.round++
            game.simonMessage = "Round "+game.round;
            setTimeout(function() { game.doSimonTurn() }, 2000);
        },

        doSimonTurn(){
            this.playerTurn = false;
            this.simonSeq.push(this.randomFrom(this.playingColors))
            this.playSimonSeq( this.startUserTurn )
        },
        
        playSimonSeq(done) {
            let playing = this.gameState === "playing";
            
            if (playing) {
                game.simonMessage = ""
                
                if(game.simonSeqIdx >= game.simonSeq.length){
                    game.ctDwn = 3;
                    game.simonSeqIdx = 0;
                    afterPlaySeq()
                    return
                }
                game.swapSimonColor(game.allColors[game.simonSeq[game.simonSeqIdx]])
                game.simonSeqIdx++
                setTimeout( game.playSimonSeq, game.simonSpeed )
            }
            
        },
        
        swapSimonColor(colorString){
            if(this.gameState === "playing"){
                this.simonColor = "#000"
                game.showSimonColor = true;
                setTimeout( function(){ game.simonColor = colorString }, 50 )
            }
        },
        
        startUserTurn(){
            this.showSimonColor = false;
            this.playerTurn = true;
            this.userAttempt = [];
        },
        
        onUserAttempt(colorIdx){
            
            this.swapSimonColor(this.allColors[colorIdx])
            
            let atmptIdx = this.userAttempt.length;
            this.userAttempt.push(colorIdx)
            console.log(this.simonSeq, this.userAttempt)
            console.log(this.round, this.simonSeq.length)
            
            let isMatch = (this.userAttempt[atmptIdx] === this.simonSeq[atmptIdx]);
            
            if (isMatch) {
                console.log('good job!')
                
                if (atmptIdx === this.simonSeq.length - 1) {
                    this.simonMessage = "Good job!"
                    console.log('round complete')
                    this.currentScore += this.scoreInc;
                    setTimeout(function() { game.startNextRound()}, 2000);
                }
            }
            else {
                this.onLose()
            }
        },
        
        
        onLose(){
            console.log('GAME OVER!')
            this.playerTurn = false;
            this.gameState = this.GAME_STATES[4]
            if (this.currentScore > this.getPersonalBest()) {
                this.$nextTick(function() {
                    this.simonMessage = "HIGH SCORE!"
                    console.log("high score")
                })
            }
            this.savePersonalBest(this.currentScore);
        },
        
        async sendScore() {
            this.username = this.nameQuery;
            console.log('sending score')
            await axios.post(this.apiUrl+'/scores', {
                username: game.username,
                score: game.currentScore
            })
            game.openScores()
        },

        getPersonalBest() {
            return localStorage.getItem("simon-best") || 0;
        },
        savePersonalBest(score) {
            if (score > this.getPersonalBest()) localStorage.setItem("simon-best", score);
        },
        
        openScores(){
            this.gameState = this.GAME_STATES[5];
            this.getHighScores()
        },
        
        async getHighScores() {
            this.screenBgURL = this.bgURLS.error;
            let res = await axios.get(this.apiUrl+'/scores?max=' + this.maxScores)
            this.highScores = res.data;
            console.log(this.highScores)
            await this.getUserScores()
            this.screenBgURL = this.bgURLS.static;
        },
        
        async getUserScores(){
            this.username = this.nameQuery;
            let res = await axios.get(this.apiUrl+'/scores/' + this.username)
            this.userScores = res.data;
            console.log(this.userScores)
        },
        
        logout() {
            this.username = "";
            this.userScores = 0;
        },
    },
    
    
    computed: {
        nameIsGood() {
            return this.nameQuery.length > 0
        }
    }
})