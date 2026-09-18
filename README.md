# Yaundromat

A mobile-first Silliman Basement (Entryway M) laundry prototype with a liquid-glass interface, built with Next.js, TypeScript and Framer Motion.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. A phone can open the computer’s LAN address; camera scanning requires an HTTPS connection (localhost is also supported).

```sh
npm test
npm run typecheck
npm run build
```

## Try it

- The room follows the supplied sketch: ten washers and four dryers, with dryers in the far-right column.
- **Do laundry** lets you enter a number, scan a machine QR, see available machines on the map or browse a soonest-first list.
- Manual entry accepts W01–W10 and D01–D04. QR payloads can be a machine ID or a URL such as `https://your-app.example/?machine=W03`.
- Use the expand control beside the filters for a full-screen map or list. The filter/sort bar stays visible; exit with the collapse control or Escape. The map has no zoom or pan controls.
- The entrance is at bottom left and the cubbies at bottom right. Blue washers and lavender dryers contrast with the lighter floor.
- Tap a machine for a centered popup. Start a 30-minute wash or 45-minute dry, follow the remaining-time pie, and collect your finished load. Finished neighbors’ loads can be moved to a cubby after the pickup window.
- Statuses are Available, Running, Pickup Window (the five minutes immediately after finishing), and Okay to move (dark green/basket). Older saved statuses migrate without losing your loads or watches.
- **Get alerts on this machine** subscribes to cycle completion and actual availability. The **Alerts** tab separates your loads from other machines you’re watching. Starting your own load enables alerts automatically.
- W03 is your seeded load. In **My loads → Try the prototype**, skip five minutes on all machines or reset the demo.
- State, alert history and subscriptions persist in localStorage under a Silliman-specific key. Reset restores all fourteen machines.

## Structure

See [DESIGN.md](DESIGN.md) for layout, styling and interaction details.

- `src/app/liquid-glass.css`: shared material styling and the Silliman interface.
- `src/components/laundry`: room map/list, machine popup, quick start, QR scanner and alerts.
- `src/components/ui/glass-dialog.tsx`: accessible centered native dialog.
- `src/lib/silliman.ts`: room slots and machine-code parsing.
- `src/lib/laundry.ts`: lifecycle rules and remaining-time calculations.
- `src/lib/alerts.ts`: watch snapshots and deduplicated event generation.
- `src/lib/laundry-storage.ts`: versioned state validation and persistence.

## Prototype scope

Machine orientation comes from the supplied sketch; numbering and cycle data are illustrative. Timers and ownership are local to this browser. There is no physical machine integration, Bluetooth connection, backend, push service or background notification delivery. Alerts catch up when the app is reopened. QR decoding runs locally; camera permission is requested only after tapping Scan QR code.

## Install on a phone

Deploy the production build to an HTTPS host (for example, Vercel), then open that URL on the phone. A plain HTTP LAN address can preview the design but cannot enable the service worker or camera on a phone.

- **iPhone:** open in Safari → Share → Add to Home Screen.
- **Android:** use the browser menu → Install app / Add to Home screen.

The installed app opens in standalone mode with its own icon, theme color and safe-area spacing. There is no in-app install button; installation uses the browser’s menu. The bottom navigation stays inside the app frame while the page content scrolls.

## Offline and updates

`npm run build` generates `public/sw.js` using `scripts/build-service-worker.mjs`. Deploy with that command; running `next build` alone does not generate the worker. The generated worker is ignored by git. It precaches the home page, manifest, icons, referenced fonts and every production JS/CSS chunk, including the lazy QR decoder. After the first successful online setup, the app can open offline and retain local loads and subscriptions. Browser storage can be cleared or evicted, so local data is not a backup.

HTML and assets stay pinned to the same build. A new worker finishes downloading before showing **Update app**; tapping it activates the update and reloads open app windows. Load data stays in localStorage. Old app caches are removed without deleting unrelated origin caches. Development mode does not register an offline worker. After testing production on a local origin, close its tabs before returning to development, or use a different port so a previously active worker cannot serve an old page.

Production verification:

```sh
npm run build
npm start
```

Open localhost, wait for offline setup, then switch DevTools to Offline and reload. Verify the map, machine lookup, loads and alerts. Phone testing uses the deployed HTTPS URL. Foregrounding the app immediately refreshes timestamps; installation does not add background push notifications.
# yaundromat
