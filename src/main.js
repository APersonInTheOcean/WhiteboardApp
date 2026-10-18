const { app, Tray, Menu, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
let tray = null;



function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		frame: false,
		icon: app.isPackaged ? path.join(process.resourcesPath, 'icon.ico') : path.join(__dirname, '../resources/icon.ico'),
		transparent: true,
		title:"Whiteboard App"

	});

	if (process.platform === 'win32') {
		win.setAppDetails({
			appId: 'com.carlo.whiteboardapp',
			appIconPath: app.isPackaged ? path.join(process.resourcesPath, 'icon.ico') : path.join(__dirname, '../resources/icon.ico'),
			appIconIndex: 0,
			relaunchCommand: `"${process.execPath}"`,
			relaunchDisplayName: 'Whiteboard App'
		});
	}
	// win.webContents.openDevTools({ mode: "detach" });


	win.loadFile(path.join(__dirname, 'index.html')   );
	return win;
}

function createTray(){

	
	let win = null;
	tray = new Tray(path.join(__dirname, '../resources/icon.png'));
	tray.addListener('click',() => {
		if (!win || win.isDestroyed()) {
		win = createWindow();
		} 
		else if (win && !win.isDestroyed()) {
			win.close();
		}
		else {
		if (win.isMinimized()) win.restore();
		win.show();
		win.focus();
		}
	})
	const contextMenu = Menu.buildFromTemplate([
		{
		label: 'Open App',
		click: () => {
			if (!win || win.isDestroyed()) {
			win = createWindow();
			} 
			else {
			if (win.isMinimized()) win.restore();
			win.show();
			win.focus();
			}
		}
		},
		{
		label: 'Minimize',
		click: () => {
			if (win && !win.isDestroyed()) {
			win.close();
			}
		}
		},
		{
		label: 'Quit',
		click: () => {
			app.quit();
		}
		}
	]);

	tray.setToolTip('Whiteboard App');
	tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
	app.setName('Whiteboard App');
	if (process.platform === 'win32') {
		app.setAppUserModelId('com.carlo.whiteboardapp');
		app.setLoginItemSettings({openAtLogin:true});/// TEST THIS IDK IF WORKS
		createTray();
		
	}
	if (process.platform === 'linux' && app.isPackaged) {
		const autostartDir = path.join(app.getPath('home'), '.config', 'autostart');
		const executable = app.getPath('exe').replaceAll('\\', '\\\\').replaceAll('"', '\\"');

		fs.mkdirSync(autostartDir, { recursive: true }); // makes the directory for the autostart folder
		fs.writeFileSync( //creates a desktop app shortcut
			path.join(autostartDir, 'whiteboardapp.desktop'),
				`[Desktop Entry]
				Type=Application
				Name=Whiteboard App
				Exec="${executable}"
				X-GNOME-Autostart-enabled=true
				`
		);
		setTimeout(createTray, 3000);


	}

  

  
	app.on('window-all-closed', () => {
		
	});
  


	

});