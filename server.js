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

const connections = [null, null]

io.on('connection', socket => {
    console.log('new WS Connection')
    
    //finc a player spot
    let playerIndex = -1
    for (let i in connections) {
        if(connections[i] === null) {
            playerIndex = i
            break
        }
    }

    //Tell the connecting client what player number he has
    socket.emit('player-number', playerIndex)

    console.log(`Player ${playerIndex} has connected`)

    //ignore more players
    if (playerIndex === -1) return

    connections[playerIndex] = false
    
    // tell players who connects
    socket.broadcast.emit('player-connection', playerIndex)

    //handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        //Tell everyone what player disconnected
        socket.broadcast.emit('player-connection', playerIndex)
    })

    //on ready
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true
    })

    //check player connections
    socket.on('check-players', () => {
        const players = []
        for(const i in connections) {
            connections[i] === null ? players.push ({connected: false, ready:false}) :
            players.push ({connected:true, ready: connections[i]})
        }
        socket.emit('check-players', players)
    })

    // on Fire receinved
    socket.on('fire', id => {
        console.log(`shot Fired from ${playerIndex}`, id)

        // Emit the move to the other player
        socket.broadcast.emit('fire', id)
    })

    // on Fire Reply 
    socket.on('fire-reply', square => {
        console.log(square)

        //Forward the reply to the otther player uhu
        socket.broadcast.emit('fire-reply', square)
    })
})