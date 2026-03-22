const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('__NOTES_DESKTOP_SHELL__', true)
