import { BrowserWindow, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.ts'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    win.loadURL('http://localhost:3000');
}
app.whenReady().then(createWindow);
