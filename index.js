var { app, BrowserWindow  } = require("electron");

var first;

function openF() {
    first = new BrowserWindow({
        height: 600,
        width: 800,
        resizable: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    first.loadFile("index.html");
};