const { server } = require('./src/app');

server.listen(80, () => {
	console.log('listening on *:80');
});