# Minecraft Clone (Web)

A browser-based Minecraft-style sandbox built with React, TypeScript, `react-three-fiber`, and Rapier physics.

## Features

- First-person movement with pointer lock controls
- Break/place block loop with a hotbar texture selector
- Basic survival inventory counters (logs, planks, wheat)
- Crafting shortcut (`F`: convert logs to planks)
- Save and reset world actions in the UI
- Three.js scene diagnostics and performance-focused render settings

## Controls

- `W A S D`: move
- `Space`: jump
- `Left Click`: punch / harvest
- `Right Click`: place selected block
- `1-7`: select hotbar item
- `F`: craft 4 planks from 1 log

## Tech Stack

- React 19
- TypeScript
- Vite
- `@react-three/fiber`, `@react-three/drei`
- `@react-three/rapier`
- Zustand

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
