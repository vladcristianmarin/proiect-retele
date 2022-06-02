import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, Container, List, ListItem, Snackbar, Typography } from '@mui/material';
import { io } from 'socket.io-client';

const App = () => {
	const [notify, setNotify] = useState(false);
	const [connected, setConnected] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [appIsRunning, setAppIsRunning] = useState(false);
	const [socket, setSocket] = useState(null);
	const [downloadedApp, setDownloadedApp] = useState(null);
	const [updatedApp, setUpdatedApp] = useState(null);
	const [apps, setApps] = useState([]);
	const [downloadedApps, setDownloadedApps] = useState([]);

	const connect = () => {
		setConnected(true);
		const socket = io('/');
		setSocket(socket);
	};

	useEffect(() => {
		if (socket) {
			socket.emit('join', isAdmin);
			socket.on('listApps', (apps) => setApps(apps));
			socket.on('downloadedApps', (apps) => {
				console.log(apps);
				setDownloadedApps(apps);
			});
			socket.on('sendApp', ({ app, buf }) => {
				setDownloadedApp(app);
				const url = window.URL.createObjectURL(new Blob([buf]));
				const link = document.createElement('a');
				link.href = url;
				link.setAttribute('download', `${app.name}.txt`);
				link.click();
			});
			socket.on('appUpdated', (app) => {
				setNotify(true);
				setApps((prev) => {
					const index = prev.find((existingApp) => existingApp.id === app.id);
					prev[index] = app;
					return prev;
				});
				setUpdatedApp(app);
			});

			return () => {
				socket.off('listApps');
				socket.off('sendApp');
				socket.off('appUpdated');
			};
		}
		//eslint-disable-next-line
	}, [socket]);

	useEffect(() => {
		if (downloadedApp && updatedApp && downloadedApp.id === updatedApp.id) {
			setDownloadedApp(updatedApp);
		}
	}, [updatedApp, downloadedApp]);

	return (
		<Box
			sx={{
				width: '100%',
				height: '100vh',
				borderRadius: '27px',
				backgroundImage:
					'radial-gradient(circle at bottom left, rgb(242, 242, 242) 0%, rgb(242, 242, 242) 6%,rgb(238, 238, 238) 6%, rgb(238, 238, 238) 15%,rgb(234, 234, 234) 15%, rgb(234, 234, 234) 47%,rgb(230, 230, 230) 47%, rgb(230, 230, 230) 54%,rgb(225, 225, 225) 54%, rgb(225, 225, 225) 56%,rgb(221, 221, 221) 56%, rgb(221, 221, 221) 90%,rgb(217, 217, 217) 90%, rgb(217, 217, 217) 100%);',
			}}>
			{connected ? (
				<Container maxWidth='md' sx={{ display: 'flex !important', justifyContent: 'space-between', margin: '0 auto' }}>
					<Box>
						<Button onClick={() => socket.emit('getApps')}>List Apps</Button>
						<List>
							{apps.map((app) => (
								<ListItem key={app.id}>
									<Typography>{app.name}</Typography>
									<Button
										onClick={() => {
											socket.emit('download', app.id);
											setAppIsRunning(false);
										}}>
										Download
									</Button>
									{isAdmin && (
										<Button
											onClick={() => {
												socket.emit('updateApp', app.id);
												setAppIsRunning(false);
											}}>
											Update
										</Button>
									)}
								</ListItem>
							))}
						</List>
						<Button onClick={() => socket.emit('getDownloadedApps')}>List Downloaded Apps</Button>
						<List>
							{downloadedApps.map((app) => (
								<ListItem
									key={app.id}
									sx={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'flex-start',
										alignItems: 'flex-start',
									}}>
									<Typography>{app.name}</Typography>
									<Typography>Version: {app.version}</Typography>
								</ListItem>
							))}
						</List>
					</Box>
					<Box>
						<Snackbar open={notify} autoHideDuration={6000} onClose={() => setNotify(false)}>
							<Alert onClose={() => setNotify(false)} severity='info' sx={{ width: '100%' }}>
								{`${updatedApp?.name} has been updated!`}
							</Alert>
						</Snackbar>
						<Typography variant='subtitle2'>Downloaded App</Typography>
						{downloadedApp && (
							<Box>
								<Typography>{downloadedApp.name}</Typography>
								<Typography>Version: {downloadedApp.version}</Typography>
								<Button color='success' onClick={() => setAppIsRunning((prev) => !prev)}>
									{appIsRunning ? 'Stop' : 'Run'}
								</Button>
								{appIsRunning && (
									<Box>
										<Typography>App is running...</Typography>
										<Typography>{downloadedApp.run}</Typography>
									</Box>
								)}
							</Box>
						)}
						{!downloadedApp && <Typography>None</Typography>}
					</Box>
				</Container>
			) : (
				<Container>
					<span style={{ display: 'flex', alignItems: 'center' }}>
						<Typography variant='subtitle1'>IS ADMIN?</Typography>
						<Checkbox checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
					</span>
					<Button onClick={connect}>Connect</Button>
				</Container>
			)}
		</Box>
	);
};

export default App;
