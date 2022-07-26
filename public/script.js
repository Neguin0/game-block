const block = document.querySelector('.block');
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (!isMobile) keyboard.style.display = 'none';

const MyNick = prompt('Digite seu nick!');

const socket = io.connect(window.location.origin);
socket.on('connect', () => {
	NewPlayer({ id: socket.id, x: 0, y: 0, score: 0, nick: MyNick });
	socket.emit('new-player', { nick: MyNick });
	
	socket.on('all-new', (players) => {
		players.forEach(player => {
			if (player.id === socket.id) return;
			NewPlayer(player)
		});
	});

	socket.on('all-move', (player) => {
		MovePlayer(player);
	});

	socket.on('all-score', (player) => {
		console.log('Jogador pontuando: ', player);
	});

	socket.on('all-delete', (player) => {
		DeletePlayer(player);
	});

	socket.on('add-fruit', (fruit) => {
		AddFruit(fruit);
	});

	socket.on('eat-fruit', (data) => {
		EatFruit(data);
	});
});

const NewPlayer = ({ id, x, y, score, nick }) => {
	const player = document.createElement('div');

	player.classList.add('player');
	player.id = id;
	player.style.transform = `translate(${x}px, ${y}px)`;


	const table = document.querySelector('.t-players');
	const tr = document.createElement('tr');
	const tdName = document.createElement('td');
	const tdScore = document.createElement('td');

	tdName.innerHTML = nick;
	tdScore.innerHTML = score;

	tr.classList.add('t-player');
	tr.id = id;
	tdName.classList.add('t-name');
	tdScore.classList.add('t-score');

	tr.appendChild(tdName);
	tr.appendChild(tdScore);
	table.appendChild(tr);

	if (id === socket.id) {
		player.style.backgroundColor = 'yellow';
		player.style.zIndex = '1';

		tdName.style.backgroundColor = '#999900';
	}

	block.appendChild(player);
}

const MovePlayer = ({ id, x, y }) => {
	const player = document.querySelector('.block #' + id);
	player.style.transform = `translate(${x}px, ${y}px)`;
}

const DeletePlayer = ({ id }) => {
	const player = document.querySelector('.player#' + id);
	const table = document.querySelector('.t-players #' + id);

	table.remove();
	player.remove();
}

const AddFruit = ({ x, y, id }) => {
	const fruit = document.createElement('div');

	fruit.classList.add('fruit');
	fruit.style.transform = `translate(${x}px, ${y}px)`;
	fruit.id = id;

	block.appendChild(fruit);
}

const EatFruit = ({ id, fruit, score }) => {
	const fruitElement = document.querySelector('.fruit#' + fruit);
	const tdScore = document.querySelector('.t-player#' + id).querySelector('.t-score');

	if (!fruitElement && id === socket.id) return;
	fruitElement.remove();
	tdScore.innerHTML = score;
}

const ClickArrow = (key) => {
	let coords = { x: 0, y: 0 };

	const KeysMove = {
		'ArrowLeft': () => coords.x--,
		'ArrowRight': () => coords.x++,
		'ArrowUp': () => coords.y--,
		'ArrowDown': () => coords.y++,

		'w': () => coords.y--,
		's': () => coords.y++,
		'a': () => coords.x--,
		'd': () => coords.x++
	};

	if (KeysMove[key]) {
		KeysMove[key]();

		socket.emit('player-move', coords);
	}
}

document.addEventListener('keydown', (event) => ClickArrow(event.key), false);
document.querySelectorAll('.arrow')
	.forEach(btn => ClickAndHold(btn, () => ClickArrow(btn.id)));

function ClickAndHold(btn, callback) {
	let timer;

	const eventStart = ['mousedown', 'touchstart'];
	const eventEnd = ['mouseup', 'touchend', 'touchcancel', 'touchleave', 'touchcancel', 'touchleave', 'mouseleave', 'mousecancel', 'mouseout'];

	eventStart.forEach(event => btn.addEventListener(event,
		() => timer = setInterval(callback, 100)));

	eventEnd.forEach(event => btn.addEventListener(event, (e) => {
		e.preventDefault();
		clearInterval(timer);
	}));
}


for (let i = 0; i < 500; i += 20) {
	for (let j = 0; j < 500; j += 20) {
		const pixel = document.createElement('div');
		pixel.classList.add('map');
		pixel.style.transform = `translate(${i}px, ${j}px)`;
		block.appendChild(pixel);
	}
}