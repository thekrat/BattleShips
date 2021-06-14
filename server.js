
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

    //finc a player spot
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
        console.log(currentPlayer)
        //přepošli střelu hráči
        if (playerNum === currentPlayer && playerNum === 1) {
            //hráč jedna výstřel
            if (user2Squares[id] === 1) {
                socket.broadcast.emit('fire-reply', id, playerNum, 'boom')
                socket.emit('fire-reply', id, playerNum, 'boom')
            }
            else {
                socket.broadcast.emit('fire-reply', id, playerNum, 'miss')
                socket.emit('fire-reply', id, playerNum, 'miss')
            }
            console.log("hráč jedna vystřelil")
            currentPlayer = 2
        } else if (playerNum === currentPlayer && playerNum === 2) {
            //hráč dva výstřel
            if (user1Squares[id] === 1) {
                socket.broadcast.emit('fire-reply', id, playerNum, 'boom')
                socket.emit('fire-reply', id, playerNum, 'boom')
            } else {
                socket.broadcast.emit('fire-reply', id, playerNum, 'miss')
                socket.emit('fire-reply', id, playerNum, 'miss')
            }
            console.log("hráč dva vystřelil")
            currentPlayer = 1           

        }
        socket.emit('whose-go', currentPlayer)
        socket.broadcast.emit('whose-go', currentPlayer)

    })
    /*
    GAME LOGIC METHODS
    */

})