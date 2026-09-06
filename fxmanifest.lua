fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'bucu_radial'
author 'BUCU Framework Team'
description 'BUCU Radial Action Wheel with Zero-Lag Trigonometric SVG Rendering'
version '1.0.0'

shared_scripts {
    'config.lua',
    'locales/en.lua',
    'locales/id.lua'
}

client_scripts {
    'client/main.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js'
}
