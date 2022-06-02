const express = require('express');
const application = express();
const http = require('http');
const server = http.createServer(application);
const cors = require('cors');
const fs = require('fs');
const io = require('socket.io')(server, {
	cors: {
		origin: 'localhost:3000',
		methods: ['GET', 'POST'],
	},
});

application.use(cors());

const app1 = {
	id: 1,
	name: 'Whats App',
	version: 1,
	run: 'Facilitating taking with your friends!',
};

const app2 = {
	id: 2,
	name: 'FaceBook',
	version: 1,
	run: 'Connecting people',
};

const app3 = {
	id: 3,
	name: 'Instagram',
	version: 1,
	run: 'Sharing your photos and memories!',
};

const apps = [app1, app2, app3];

const downloadedApps = {};

let sockets = [];

io.on('connection', (socket) => {
	console.log(`${socket.id} has connected`);
	socket.on('join', (isAdmin) => {
		console.log(`${socket.id} has joined`);
		sockets.push({ socketId: socket.id, isAdmin });

		socket.on('getApps', () => {
			console.log(socket.id + ' listed all the apps');
			socket.emit('listApps', apps);
		});

		socket.on('download', (id) => {
			const app = apps.find((app) => app.id === id);
			if (!downloadedApps[socket.id]) {
				downloadedApps[socket.id] = [];
			}
			downloadedApps[socket.id].push(app);
			fs.readFile(`apps/${app.id}.txt`, (_err, buf) => {
				socket.emit('sendApp', { app, buf });
			});
			console.log(socket.id + ' downloaded ' + app.name + ' version ' + app.version);
		});

		socket.on('updateApp', (id) => {
			if (sockets.find((s) => s.socketId === socket.id).isAdmin) {
				const appToUpdate = apps.find((app) => app.id === id);
				const appToUpdateIndex = apps.findIndex((app) => app.id === id);
				fs.readFile(`apps/${id}.txt`, 'utf8', function (err, data) {
					var formatted = data.replace(/Version: [0-9]+/g, `Version: ${appToUpdate.version}`);

					fs.writeFile(`apps/${id}.txt`, formatted, 'utf8', function (err) {
						if (err) return console.log(err);
					});
				});
				appToUpdate.version++;
				apps[appToUpdateIndex] = appToUpdate;
				console.log(`${appToUpdate.name} updated! ${appToUpdate.version}`);
				io.to(sockets.map((socket) => socket.socketId)).emit('appUpdated', appToUpdate);
				console.log(socket.id + ' updated ' + appToUpdate.name);
			}
		});

		socket.on('getDownloadedApps', () => {
			console.log(socket.id + ' listed all downloaded apps');
			let apps = downloadedApps[socket.id];
			if (!apps) {
				apps = [];
			}
			socket.emit('downloadedApps', apps);
		});
	});

	socket.on('disconnect', () => {
		sockets = sockets.filter((s) => s.socketId !== socket.id);
		console.log('User Disconnected');
	});
});

server.listen(3030, () => {
	console.log('Server has started on port 3030');
});
