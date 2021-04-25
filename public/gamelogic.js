//const { groupCollapsed } = require("node:console")

document.addEventListener('DOMContentLoaded', () => {
    const user1Grid = document.querySelector('.user1-board')
    const user2Grid = document.querySelector('.user2-board')
    const setupGrid = document.querySelector('.grid-setup')
    const ships = document.querySelectorAll('.ship')
    const destroyer = document.querySelector('.destroyer-container')
    const cruiser = document.querySelector('.cruiser-container')
    const carrier = document.querySelector('.carrier-container')
    const submarine = document.querySelector('.submarine-container')
    const battleship = document.querySelector('.battleship-container')
    const startButton = document.querySelector('#start')
    const muteButton = document.querySelector('#mute')
    const rotateButton = document.querySelector('#rotate')
    const singlePlayerButton = document.querySelector('#singleplayer')
    const multiPlayerButton = document.querySelector('#multiplayer')
    const gameInfo = document.querySelector('.game-state')
    const user1Squares = []
    const user2Squares = []
    let isHorizontal = true
    let isGameOver = false
    let currentPlayer = 'user'
    let gameMode = ""
    let playerNum = 0
    let ready = false
    let enemyReady = false
    let allShipPlaced = false
    let shotFired = -1
    
    //Select Game Mode
    singlePlayerButton.addEventListener('click', startSinglePlayer)
    multiPlayerButton.addEventListener('click', startMultiPlayer)

    const size = 10

    //Multi player

    function startMultiPlayer () {
        gameMode = 'multiPlayer'

        const socket = io()

        //get player number
        socket.on('player-number', num => {
            if (num === -1) {
                gameInfo.innerHTML = "sorry, server is full"
            } else {
                playerNum = parseInt(num)
                if(playerNum === 1) currentPlayer = "enemy"
    
                console.log(playerNum)

                //get other player status
                socket.emit('check-players')
            }
    
        })

        //Another player has connected or disconnected 
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`)
            playerConnectedOrDisconnected(num)
        })

        //on enemy ready
        socket.on('enemy-ready', num => {
            enemyReady = true
            playerReady(num)
            if (ready) playGameMulti(socket)
        })

        //check player status
        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if(p.connected) playerConnectedOrDisconnected(i)
                if(p.ready) {
                    playerReady(i)
                    if(i !== playerReady) enemyReady = ready
                }
            })
        })

        //Ready button Click 
        startButton.addEventListener('click', () => {
            if(allShipPlaced) playGameMulti(socket)
            else gameInfo.innerHTML = "please place all ships"
        })

        //setup event listener for fireing
        user2Squares.forEach(square => {
            square.addEventListener('click', () => {
                shotFired = square.dataset.id
                socket.emit('fire', shotFired)
            })
        })

        // On fire received
        socket.on('fire', id => {
            user2Go(id)
            const square = user1Squares[id]
            socket.emit('fire-reply', square.classList)
            playGameMulti(socket)
        })

        // On Fire Reply received
        socket.on('fire-reply', classList => {
            revealSquare(classList)
            playGameMulti(socket)
        })


        function playerConnectedOrDisconnected(num) {
            let player = `.p${parseInt(num) + 1}`
            document.querySelector(`${player} .connected span`).classList.toggle('green')
            if(parseInt(num) === playerNum) document.querySelector(player).style.
            fontWeight = 'bold'
        }

    }

    //Single PLayer
    function startSinglePlayer() {
        gameMode = "singlePlayer"
        
        generate(shipArray[0])
        generate(shipArray[1])
        generate(shipArray[2])
        generate(shipArray[3])
        generate(shipArray[4])

        startButton.addEventListener('click', playGameSingle)
    }

    //Create Board
    function createBoard(grid, squares) {
        for (let i = 0; i < size * size; i++) {
            const square = document.createElement('div')
            square.dataset.id = i
            grid.appendChild(square)
            squares.push(square)
        }

    }

    //Ships
    const shipArray = [
        {
            name: 'destroyer',
            directions: [
                [0, 1],
                [0, size]
            ]
        },
        {
            name: 'submarine',
            directions: [
                [0, 1, 2],
                [0, size, size * 2]
            ]
        },
        {
            name: 'cruiser',
            directions: [
                [0, 1, 2],
                [0, size, size * 2]
            ]
        },
        {
            name: 'battleship',
            directions: [
                [0, 1, 2, 3],
                [0, size, size * 2, size * 3]
            ]
        },
        {
            name: 'carrier',
            directions: [
                [0, 1, 2, 3, 4],
                [0, size, size * 2, size * 3, size * 4]
            ]
        },
    ]

    createBoard(user1Grid, user1Squares)
    createBoard(user2Grid, user2Squares)

    function generate(ship) {
        console.log(Object.keys(ship).length)
        console.log(ship.directions[0].length)
        let squareDirection = Math.floor(Math.square() * Object.keys(ship).length)
        console.log(squareDirection)
        let current = ship.directions[squareDirection]
        console.log(ship.directions[0].length)
        let squareStart = 0
        if (squareDirection === 0) {
            squareStart = Math.floor(Math.square() * (10 - ship.directions[squareDirection].length)) + Math.floor(Math.square() * 10) * 10
        }
        if (squareDirection === 1) {
            squareStart = Math.floor(Math.square() * 10) + Math.floor(Math.square() * (10 - ship.directions[squareDirection].length) * 10)
        }
        console.log(squareStart)

        const isTaken = current.some(index => user2Squares[squareStart + index].classList.contains('taken'))

        if (!isTaken) current.forEach(index => user2Squares[squareStart + index].classList.add('taken', ship.name))

        else generate(ship)
    }

    //rotate ships
    function rotate() {
        destroyer.classList.toggle('destroyer-container-vertical')
        submarine.classList.toggle('submarine-container-vertical')
        cruiser.classList.toggle('cruiser-container-vertical')
        carrier.classList.toggle('carrier-container-vertical')
        battleship.classList.toggle('battleship-container-vertical')
        isHorizontal = !isHorizontal

    }

    rotateButton.addEventListener('click', rotate)

    //move ship
    console.log(ships)
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    user1Squares.forEach(square => square.addEventListener('dragstart', dragStart))
    user1Squares.forEach(square => square.addEventListener('dragover', dragOver))
    user1Squares.forEach(square => square.addEventListener('dragenter', dragEnter))
    user1Squares.forEach(square => square.addEventListener('dragleave', dragLeave))
    user1Squares.forEach(square => square.addEventListener('drop', dragDrop))
    user1Squares.forEach(square => square.addEventListener('dragend', dragEnd))

    let selectedShipNameWithIndex
    let draggedShip
    let draggedShipLength

    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
        selectedShipNameWithIndex = e.target.id
        console.log(selectedShipNameWithIndex)
    }))

    function dragStart(e) {
        draggedShip = this
        draggedShipLength = this.childElementCount
        console.log(draggedShip)

    }

    function dragOver(e) {
        e.preventDefault()
    }

    function dragEnter(e) {
        e.preventDefault()
    }

    function dragLeave() {
        console.log('drag leave')
    }

    function dragDrop() {
        console.log(draggedShip)
        let shipNameWithLastId = draggedShip.lastElementChild.id
        let shipClass = shipNameWithLastId.slice(0, -2)
        console.log(shipClass)
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
        let shipLastId = lastShipIndex + parseInt(this.dataset.id)

        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

        shipLastId = shipLastId - selectedShipIndex

        if (isHorizontal) {
            for (let i = 0; i < draggedShipLength; i++) {
                user1Squares[parseInt(this.dataset.id) + i].classList.add('taken', shipClass)
            }
        } else if (!isHorizontal) {
            for (let i = 0; i < draggedShipLength; i++) {
                user1Squares[parseInt(this.dataset.id) - selectedShipIndex + size * i].classList.add('taken', shipClass)
            }
        }

        setupGrid.removeChild(draggedShip)
        if(!setupGrid.querySelector('.ship')) allShipPlaced = true

    }

    function dragEnd() {
        console.log('dragend')
    }

    //game logic multi
    function playGameMulti(socket) {
        if(isGameOver) return
        if(!ready) {
            socket.emit('player-ready')
            ready = true
            playerReady(playerNum)
        }

        if(enemyReady) {
            if(currentPlayer === 'user') {
                gameInfo.innerHTML = 'Your Go'
            }
            if(currentPlayer === 'enemy') {
                gameInfo.innerHTML = "Enemy's Go"
            }
        }
    }

    function playerReady(num) {
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .ready span`).classList.toggle('green')
    }

    //game logic single
    function playGameSingle() {
        console.log(isGameOver)
        if (isGameOver) return
        if (currentPlayer === 'user') {
            gameInfo.innerHTML = 'Your Go'
            user2Squares.forEach(square => square.addEventListener('click', function (e) {
                revealSquare(square.classList)
            }))
        }
        if (currentPlayer === 'enemy') {
            gameInfo.innerHTML = 'Computers Go'
            setTimeout(user2Go, 1000)
            //function user2Go

        }
    }

    let destroyerCount = 0
    let submarineCount = 0
    let cruiserCount = 0
    let battleshipCount = 0
    let carrierCount = 0


    function revealSquare(classList) {
        const enemySquare = user2Grid.querySelector(`div[data-id='${shotFired}']`)
        const obj = Object.values(classList)
        if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
            if (obj.includes('destroyer')) destroyerCount++
            if (obj.includes('submarine')) submarineCount++
            if (obj.includes('cruiser')) cruiserCount++
            if (obj.includes('battleship')) battleshipCount++
            if (obj.includes('carrier')) carrierCount++
        }
        if (obj.includes('taken')) {
            enemySquare.classList.add('boom')
        } else {
            enemySquare.classList.add('miss')
        }
        checkForWins()
        currentPlayer = 'enemy'
        if(gameMode === 'singlePlayer') playGameSingle()
    }

    let destroyerCount2 = 0
    let submarineCount2 = 0
    let cruiserCount2 = 0
    let battleshipCount2 = 0
    let carrierCount2 = 0

    function user2Go(square) {
        if (gameMode === 'singleplayer') square = Math.floor(Math.square() * user1Squares.length)

        if (!user1Squares[square].classList.contains('boom')) {
            user1Squares[square].classList.add('boom')
            if (user1Squares[square].classList.contains('destroyer')) destroyerCount2++
            if (user1Squares[square].classList.contains('submarine')) submarineCount2++
            if (user1Squares[square].classList.contains('cruiser')) cruiserCount2++
            if (user1Squares[square].classList.contains('battleship')) battleshipCount2++
            if (user1Squares[square].classList.contains('carrier')) carrierCount2++
            checkForWins()
        } else if (gameMode === 'singleplayer') user2Go()
        currentPlayer = 'user'
        gameInfo.innerHTML = 'Yours Go'
        
    }

    function checkForWins() {
        if (destroyerCount === 2) {
            gameInfo.innerHTML = 'You sunk the destroyer'
        }
        if (submarineCount === 3) {
            gameInfo.innerHTML = 'You sunk the submarine'
        }
        if (cruiserCount === 3) {
            gameInfo.innerHTML = 'You sunk the cruiser'
        }
        if (battleshipCount === 4) {
            gameInfo.innerHTML = 'You sunk the battleship'
        }
        if (carrierCount === 5) {
            gameInfo.innerHTML = 'You sunk the carrier'
        }

        if (destroyerCount2 === 2) {
            gameInfo.innerHTML = 'your opponent sunked your destroyer'
        }
        if (submarineCount2 === 3) {
            gameInfo.innerHTML = 'your opponent sunked your submarine'
        }
        if (cruiserCount2 === 3) {
            gameInfo.innerHTML = 'your opponent sunked your cruiser'
        }
        if (battleshipCount2 === 4) {
            gameInfo.innerHTML = 'your opponent sunked your battleship'
        }
        if (carrierCount2 === 5) {
            gameInfo.innerHTML = 'your opponent sunked your carrier'
        }

        if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 17) {
            gameInfo.innerHTML = "You Win"
            gameOver()
        }

        
        if ((destroyerCount2 + submarineCount2 + cruiserCount2 + battleshipCount2 + carrierCount2) === 17) {
            gameInfo.innerHTML = "Your opponent Wins"
            gameOver()
        }
    }

    function gameOver() {
        isGameOver = true
        startButton.removeEventListener('click', playGameSingle)
    }
})