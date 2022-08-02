const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');
const axios = require('axios');

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
let ips = [];

io.on('connection', (socket) => {
	const id = 'player-' + socket.id;
	const clientIp = socket.request.connection.remoteAddress;


	socket.on('new-player', ({ nick }) => {
		if (ips.includes(clientIp)) return socket.disconnect(true);
		if (Object.keys(players).length === 0) MoveFruit();

		ips.push(clientIp);
		players[id] = {
			id,
			x: 0,
			y: 0,
			score: 0,
			nick
		};

		GetFruit();
		io.emit('all-new', Object.values(players));

		console.log('Player connected: ', id, clientIp);
		console.log('Players: ', players);
	});

	socket.on('player-move', ({ x, y }) => {
		if (!players[id]) return;

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
		if (!players[id]) return;

		console.log('Player disconnected: ', id);

		io.emit('all-delete', players[id]);
		delete players[id];
		ips.splice(ips.indexOf(clientIp), 1);
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

	function GetFruit() {
		io.emit('all-fruit', fruit);
		return {
			x: fruit.x,
			y: fruit.y
		};
	}
});

function Random(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}


app.get('/status', (req, res) => {
	res.status(200).json({ status: 200 })
});

setInterval(async () => {
	await axios.get('https://gameblock0.herokuapp.com/status');
}, 60000);

module.exports = { app, server, io };
