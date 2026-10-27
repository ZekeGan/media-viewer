import React from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import 'react-grid-layout/css/styles.css'
import './style.css'
import { App } from './App'
createRoot(document.getElementById('root')!).render(<React.StrictMode><MantineProvider defaultColorScheme="dark" theme={{ primaryColor: 'teal', defaultRadius: 'md', fontFamily: "system-ui, 'Microsoft JhengHei', sans-serif" }}><App /></MantineProvider></React.StrictMode>)
