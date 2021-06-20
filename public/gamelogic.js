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
    const gameInfo = document.querySelector('#game-info')
    const whoseGo = document.querySelector('#whose-go')
    let userSquares = []
    let EnemySquares = []
    let isHorizontal = true
    let playerNum = 0
    let allShipPlaced = true
    let shotFired = -1
    const size = 10

    var miss = new Audio('sounds/miss_shot.wav');
    var hit = new Audio('sounds/hit_shot.wav');


    //Create Game Boards
    createBoard(user1Grid, userSquares)
    createBoard(user2Grid, EnemySquares)

    //Select Game Mode
    if (gameMode === "singlePlayer") {

    } else if (gameMode === 'multiPlayer') {
        startMultiPlayer();
    }




    //Ship Array
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



    //Multi player
    function startMultiPlayer() {
        gameMode = 'multiPlayer'

        const socket = io()

        //get player number
        socket.on('player-number', num => {
            if (num === -1) {
                gameInfo.innerHTML = "sorry, server is full"
            } else {
                playerNum = parseInt(num)

                //get other player status
                socket.emit('check-players')
            }

        })

        //check player status
        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if (p.connected) playerConnectedOrDisconnected(i)
                if (p.ready) {
                    playerReady(i)
                }
            })
        })

        //Another player has connected or disconnected 
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`)
            playerConnectedOrDisconnected(num)
        })

        //on enemy ready
        socket.on('enemy-ready', num => {
            playerReady(num)
        })

        //Ready button Click
        startButton.addEventListener('click', () => {
            if (allShipPlaced) {
                socket.emit('player-ready', createUserBoard())
                gameInfo.innerHTML = 'Waiting for an opponent'
            } else {
                gameInfo.innerHTML = 'Please place all your ships!'
            }
        })

        //When both player are ready, 
        socket.on('start-multiplayer', () => {
            gameInfo.innerHTML = ''
            //setup event listener for fireing
            EnemySquares.forEach(square => {
                square.addEventListener('click', () => {
                    shotFired = square.dataset.id
                    socket.emit('fire', shotFired)
                })
            })

        })

        //Tells which player disconnected or connected
        function playerConnectedOrDisconnected(num) {
            let player = parseInt(num)
            let connectedPlayer = '.p2'
            if (player === playerNum) connectedPlayer = '.p1'
            document.querySelector(`${connectedPlayer} .connected span`).classList.toggle('green')


        }

        //Tells which player is Ready or Not
        function playerReady(num) {
            let player = parseInt(num)
            let readyPlayer = '.p2'
            if (player === playerNum) readyPlayer = '.p1'
            document.querySelector(`${readyPlayer} .ready span`).classList.toggle('green')
        }

        // On fire received
        socket.on('fire-reply', (id, num, shot) => {
            if(shot === "miss") {
                miss.play()
            } else {
                hit.play()
            }
            if (playerNum === parseInt(num) - 1) {
                //změn plochu nepřítele
                let enemySquare = user2Grid.querySelector(`div[data-id='${id}']`)
                enemySquare.classList.add(shot)
                
                

            }
            else {
                let userSquare = user1Grid.querySelector(`div[data-id='${id}']`)
                userSquare.classList.add(shot)
                //změn svoji plochu
            }
        })

        socket.on('whose-go', currentPlayer => {
            if (playerNum + 1 == currentPlayer) {
                whoseGo.innerHTML = 'Your Go'
            } else {
                whoseGo.innerHTML = "Opponent's turn"
            }
        })

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
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragover', dragOver))
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    userSquares.forEach(square => square.addEventListener('drop', dragDrop))
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

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
        //console.log('drag leave')
    }

    function dragDrop() {
        //console.log(draggedShip)
        let shipNameWithLastId = draggedShip.lastElementChild.id
        let shipClass = shipNameWithLastId.slice(0, -2)
        let firstId
        //console.log(shipClass)
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
        shipLastId = lastShipIndex + parseInt(this.dataset.id)
        if (!isHorizontal) shipLastId = lastShipIndex * size + parseInt(this.dataset.id)

        const notAllowedHorizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 2, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63, 73, 83, 93]
        const notAllowedVertical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60]

        let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
        let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

        console.log(notAllowedVertical)
        console.log(newNotAllowedVertical)

        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

        if (isHorizontal) {
            shipLastId = shipLastId - selectedShipIndex
            
        }
        if (!isHorizontal) {
            shipLastId = shipLastId - selectedShipIndex * size
            firstId = shipLastId - (draggedShipLength-1) * 10
        }

        if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
            for (let i = 0; i < draggedShipLength; i++) {
               if (userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.contains('taken')) return
            }
            for (let i = 0; i < draggedShipLength; i++) {
                let positionClass = 'middle'
                if (i === 0) positionClass = 'start'
                if (i === draggedShipLength - 1) positionClass = 'end'
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', positionClass, shipClass)
            }
        } else if (!isHorizontal && !newNotAllowedVertical.includes(firstId)) {
            for (let i = 0; i < draggedShipLength; i++) {
                if (userSquares[parseInt(this.dataset.id) - selectedShipIndex * size + size * i].classList.contains('taken')) return
            }
            
            for (let i = 0; i < draggedShipLength; i++) {
                let positionClass = 'middle'
                if (i === 0) positionClass = 'start'
                if (i === draggedShipLength - 1) positionClass = 'end'
                userSquares[parseInt(this.dataset.id) - selectedShipIndex * size + size * i].classList.add('taken', 'vertical', positionClass, shipClass)
            }
        } else return

        setupGrid.removeChild(draggedShip)
        if (!setupGrid.querySelector('.ship')) allShipPlaced = true

    }

    function dragEnd() {
        console.log('dragend')
    }

    //generate random ship layout for PC
    function generate(ship) {
        let squareDirection = Math.floor(Math.random() * Object.keys(ship).length)
        let current = ship.directions[squareDirection]
        let squareStart = 0
        if (squareDirection === 0) {
            squareStart = Math.floor(Math.random() * (10 - ship.directions[squareDirection].length)) + Math.floor(Math.random() * 10) * 10
        }
        if (squareDirection === 1) {
            squareStart = Math.floor(Math.random() * 10) + Math.floor(Math.random() * (10 - ship.directions[squareDirection].length) * 10)
        }
        console.log(squareStart)

        const isTaken = current.some(index => EnemySquares[squareStart + index].classList.contains('taken'))

        if (!isTaken) current.forEach(index => EnemySquares[squareStart + index].classList.add('taken', ship.name))

        else generate(ship)
    }

    function createUserBoard() {
        let userBoard = new Array(100).fill(0);
        let i = 0
        userSquares.forEach(square => {
            if (square.classList.contains('taken')) {
                userBoard[i] = 1
            }
            i++
        });
        return userBoard
    }



})