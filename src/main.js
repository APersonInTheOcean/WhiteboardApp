const { app, Tray, Menu, BrowserWindow } = require('electron');
const path = require('node:path');
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

app.whenReady().then(() => {
	app.setName('Whiteboard App');
	if (process.platform === 'win32') {
		app.setAppUserModelId('com.carlo.whiteboardapp');
		app.setLoginItemSettings({openAtLogin:true});/// TEST THIS IDK IF WORKS
		
	}

  let win = createWindow();

  
  app.on('window-all-closed', () => {
	
  });
  



  tray = new Tray(path.join(__dirname, '../resources/icon.png'));
  tray.addListener('click',() => {
	if (!win || win.isDestroyed()) {
	  win = createWindow();
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

});