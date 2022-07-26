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
let fruit = {
	x: 0,
	y: 0
};

io.on('connection', (socket) => {
	const { id } = socket;
	console.log('Player connected: ', id);

	socket.on('new-player', ({ nick }) => {
		if (Object.keys(players).length === 0) MoveFruit();

		players[id] = {
			id,
			x: 0,
			y: 0,
			score: 0,
			nick
		};

		io.emit('all-new', Object.values(players));
	});

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

		if (fruit.x === players[id].x && fruit.y === players[id].y) {
			MoveFruit(id);
		}

		io.emit('all-move', players[id]);
	});

	socket.on('disconnect', () => {
		console.log('Player disconnected: ', id);

		io.emit('all-delete', players[id]);
		delete players[id];
	});


	function MoveFruit(id) {
		fruit.x = Random(0, 480 / 20) * 20;
		fruit.y = Random(0, 480 / 20) * 20;

		let data = {
			x: fruit.x,
			y: fruit.y
		};

		if (id) {
			players[id].score++;

			data.id = id;
			data.score = players[id].score;
		}

		io.emit('all-fruit', data);
	}
});

function Random(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = { app, server, io };