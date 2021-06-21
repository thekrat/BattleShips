
//server config
const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

//set folder
app.use(express.static(path.join(__dirname, "public")))

//start server
server.listen(PORT, () => console.log(`Running on port ${PORT}`))


//game logic variables
let user1DestroyerCount = 0
let user1SubmarineCount = 0
let user1CruiserCount = 0
let user1BattleshipCount = 0
let user1CarrierCount = 0


let user2DestroyerCount = 0
let user2SubmarineCount = 0
let user2CruiserCount = 0
let user2BattleshipCount = 0
let user2CarrierCount = 0




let user1Squares
let user2Squares
let isGameOver = false
let gameMode = ""
let ready = false
let allShipPlaced = false
let currentPlayer = 1

//all connections
const connections = [null, null]

io.on('connection', socket => {

    console.log('new WS Connection')
    //players variables
    let playerNum = 0
    let enemyReady = false

    //find a player spot
    var playerIndex = -1
    for (let i in connections) {
        if (connections[i] === null) {
            playerIndex = i
            break
        }
    }
    //ignore more players
    if (playerIndex === -1) return

    connections[playerIndex] = false

    console.log(`Player ${playerIndex} has connected`)

     //Set up Player number
     playerNum = parseInt(playerIndex) + 1

    //Tell the connecting client what player number he has
    socket.emit('player-number', playerIndex)


    // tell players who connects
    socket.broadcast.emit('player-connection', playerIndex)

    //handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerNum} disconnected`)
        connections[playerIndex] = null

        //Tell everyone what player disconnected
        socket.broadcast.emit('player-connection', playerIndex)
    })

    //on ready
    socket.on('player-ready', placedShips => {
        //kontrola jestli lodě jsou umístěny správně poté ready player nebo error message
        socket.emit('enemy-ready', playerIndex)
        socket.broadcast.emit('enemy-ready', playerIndex)
        console.log(playerIndex)
        if (playerIndex == 0) {
            user1Squares = placedShips
            console.log("nastavení hráč 1")
            
        }
        else {
            user2Squares = placedShips
            console.log("nastavení hráč 2")
        }
        connections[playerIndex] = true
        if (connections[0] === true && connections[1] === true) {
            io.emit('start-multiplayer')
            io.emit('whose-go', 1)
        }
    })

    //check player connections
    socket.on('check-players', () => {
        const players = []
        for (const i in connections) {
            connections[i] === null ? players.push({ connected: false, ready: false }) :
                players.push({ connected: true, ready: connections[i] })
        }
        socket.emit('check-players', players)
    })

    // on Fire receinved
    socket.on('fire', id => {
        console.log(`shot Fired from ${playerIndex}`, id)
        //check which player shot and if it is their turn reveal the square
        console.log(currentPlayer)
        console.log(playerNum)
        if (playerNum === currentPlayer && playerNum === 1) {
            //
            if (user2Squares[id] != '') {    
                io.emit("game-info", "Hit")
                countShips(currentPlayer, id)  
                checkForWinsUser2();     
                io.emit('fire-reply', id, playerNum, 'boom')
                currentPlayer = 1
                console.log(currentPlayer)


            }
            else {
               io.emit('fire-reply', id, playerNum, 'miss')
               io.emit("game-info", "Miss")
                currentPlayer = 2
            }
            console.log("hráč jedna vystřelil")
           
        } else if (playerNum === currentPlayer && playerNum === 2) {
            //hráč dva výstřel
            if (user1Squares[id] != '') {
                io.emit("game-info", "Hit")
                io.emit('fire-reply', id, playerNum, 'boom')
                countShips(currentPlayer, id)
                checkForWinsUser1();
                currentPlayer = 2
            } else {
                io.emit('fire-reply', id, playerNum, 'miss')
                currentPlayer = 1  
                io.emit("game-info", "Miss")
            }
            console.log("hráč dva vystřelil")
                    

        }
        socket.emit('whose-go', currentPlayer)
        socket.broadcast.emit('whose-go', currentPlayer)

    })
    /*
    GAME LOGIC METHODS
    */

    function countShips (currentPlayer, id) {
        if(currentPlayer === 1){
            if(user2Squares[id] === 'destroyer'){
                user2DestroyerCount += 1
            } else if(user2Squares[id] === 'cruiser'){
               user2CruiserCount += 1
            } else if(user2Squares[id] === 'battleship'){
                user2BattleshipCount += 1
            }else if(user2Squares[id] === 'submarine'){
                user2SubmarineCount += 1
            }else if(user2Squares[id] === 'carrier'){
                user2CarrierCount += 1
            } 
           
        }
        else {
            if(user1Squares[id] === 'destroyer'){
                user1DestroyerCount += 1
            } else if(user1Squares[id] === 'cruiser'){
                user1CruiserCount += 1
            } else if(user1Squares[id] === 'battleship'){
                user1BattleshipCount += 1
            }else if(user1Squares[id] === 'submarine'){
                user1SubmarineCount += 1
            }else if(user1Squares[id] === 'carrier'){
                user1CarrierCount += 1
            }       
        }      
    }

    function checkForWinsUser1(){
        if (user1DestroyerCount === 2) {
            user1DestroyerCount = 10
            io.emit("destroyed-ship", currentPlayer)
          }
          if (user1SubmarineCount === 3) {
            user1SubmarineCount = 10
            io.emit("destroyed-ship", currentPlayer)
          }
          if (user1CruiserCount === 3) {
            user1CruiserCount = 10
            io.emit("destroyed-ship", currentPlayer)
          }
          if (user1BattleshipCount === 4) {
            user1BattleshipCount = 10
            io.emit("destroyed-ship", currentPlayer)
          }
          if (user1CarrierCount === 5) {
            user1CarrierCount = 10
            io.emit("destroyed-ship", currentPlayer)
        }
        if (user1BattleshipCount + user1CarrierCount + user1CruiserCount + user1DestroyerCount + user1SubmarineCount == 50) {
            io.emit("game-end", currentPlayer)
        }
    }

    function checkForWinsUser2(){
        if (user2DestroyerCount === 2) {
            user2DestroyerCount = 10
            io.emit("destroyed-ship", currentPlayer)
          }
          if (user2SubmarineCount === 3) {
            user2SubmarineCount = 10
            io.emit("destroyed-ship", currentPlayer)
          }
          if (user2CruiserCount === 3) {
            user2CruiserCount = 10
            io.emit("destroyed-ship", currentPlayer)
          }
          if (user2BattleshipCount === 4) {
            user2BattleshipCount = 10
            io.emit("destroyed-ship", currentPlayer)
          }
          if (user2CarrierCount === 5) {
            user2CarrierCount = 10
            io.emit("destroyed-ship", currentPlayer)
        }
        if (user2BattleshipCount + user2CarrierCount + user2CruiserCount + user2DestroyerCount + user2SubmarineCount == 50) {
            io.emit("game-end", currentPlayer)
        }
    }

    

})