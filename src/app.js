const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());

//Database
let players = {};
let fruits = [];

io.on('connection', (socket) => {
  const { id } = socket;
  console.log('Player connected: ', id);

  players[id] = {
    id,
    x: 0,
    y: 0,
    score: 0
  };
	socket.on('new-player', ({nick})=>{
		players[id].nick = nick;	
	});

  io.emit('all-new', Object.values(players));

  socket.on('player-move', ({ x, y }) => {
    const speed = 20;
    if (x === 1) players[id].x += speed;
    if (x === -1) players[id].x -= speed;
    if (y === 1) players[id].y += speed;
    if (y === -1) players[id].y -= speed;

    if (players[id].x < 0) players[id].x = 0;
    if (players[id].x > 480) players[id].x = 480;
    if (players[id].y < 0) players[id].y = 0;
    if (players[id].y > 480) players[id].y = 480;

    const fruit = getFruit(players[id].x, players[id].y);

    if (fruit !== undefined) {
      players[id].score++;

      io.emit('eat-fruit', {
        id,
        score: players[id].score,
        fruit: fruit.id
      });
      fruits.splice(fruit.id, 1);
    }

    io.emit('all-move', players[id]);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected: ', id);
    io.emit('all-delete', players[id]);
    delete players[id];
  });
});

setInterval(() => {
  if (players.length === 0) return;

  function Random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function RandomPos() {
    return Random(0, 480 / 20) * 20;
  }

  const fruit = {
    id: "fruit" + fruits.length ?? fruits.length - 1,
    x: RandomPos(),
    y: RandomPos()
  }

  while (getFruit(fruit.x, fruit.y) !== undefined) {
    fruit.x = RandomPos();
    fruit.y = RandomPos();
  }

  fruits.push(fruit);
  io.emit('add-fruit', fruit);
}, 5000);

function getFruit(x, y) {
  return fruits.find(fruit => fruit.x === x && fruit.y === y);
}

module.exports = { app, server, io };
