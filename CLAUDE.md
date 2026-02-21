# Jello — CLAUDE.md

## Project Overview
Jello is a music streaming web app that streams audio from YouTube channels. The user selects a channel, browses its videos as song cards, and plays them directly in the browser using yt-dlp for audio extraction.

## Tech Stack
- **Frontend:** React 19, Vite, Axios
- **Backend:** Python Flask, Flask-CORS
- **Audio extraction:** yt-dlp (subprocess)
- **Data source:** YouTube Data API v3
- **Styling:** Plain CSS, glassmorphism dark theme

## Project Structure
```
Jellov2/
├── src/
│   ├── App.jsx                          # Root component, all app state, audio engine
│   ├── main.jsx                         # React entry point
│   ├── index.css                        # Global styles, color scheme
│   └── components/
│       ├── Sidebar/
│       │   ├── Sidebar.jsx              # Channel search bar + channel list + now-playing
│       │   └── Sidebar.css
│       ├── MainContent/
│       │   ├── MainContent.jsx          # Song grid header, song search bar
│       │   └── MainContent.css
│       ├── AlbumGrid/
│       │   ├── AlbumGrid.jsx            # Responsive CSS grid wrapper
│       │   └── AlbumGrid.css
│       ├── AlbumCard/
│       │   ├── AlbumCard.jsx            # Individual song card with play/download overlays
│       │   └── AlbumCard.css
│       └── PlayerBar/
│           ├── PlayerBar.jsx            # Playback controls, progress, volume
│           └── PlayerBar.css
└── Python Backend/
    ├── server.py                        # Flask app, API routes
    ├── jello_backend.py                 # YouTube API integration, channel definitions
    ├── main.py                          # Legacy CLI interface
    └── .env                             # YOUTUBE_API_KEY
```

## API Endpoints (Flask, base: http://127.0.0.1:5000/api)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/channels` | List all available channels |
| GET | `/channels/search?q=<query>` | Search YouTube for channels by name |
| GET | `/uploads/<channel_id>` | Fetch latest 50 videos for a channel |
| GET | `/search/<channel_id>?q=<query>` | Search videos within a channel |
| GET | `/stream/<video_id>` | Stream audio via yt-dlp (no caching) |
| GET | `/download/<video_id>?title=<title>` | Download audio as MP3 |

## State Management
State lives entirely in `App.jsx` using React hooks (no Redux/Zustand). Key state:
- `channels` — available channels fetched from `/api/channels`
- `activeChannel` — currently selected channel object
- `songs` — songs in the active channel
- `currentSong` / `currentSongIndex` — now playing
- `isPlaying`, `progress`, `currentTime`, `duration`, `volume`

State is passed down to child components as props. No Context API used.

## Audio Engine
`App.jsx` manages an `<audio>` element via `audioRef` and connects it to the Web Audio API for:
- Real-time frequency analysis (FFT size 256)
- A dynamic 4-blob radial gradient background that reacts to bass energy
- Color palette extracted from the current song's thumbnail via canvas sampling

## Data Objects

**Channel:**
```js
{ id: string, name: string, isHeader: boolean }
```

**Song:**
```js
{ id: string, title: string, artist: string, cover: string, duration: string, audio: string }
```
Note: `artist` is always `"Unknown"` and `duration` is always `"0:00"` — not fetched from the API.

## Hardcoded Channels (jello_backend.py)
Trap Nation, Electro Posé, Chill Nation, NCS, MrSuicideSheep, Trap City, CloudKid.

---

## Changelog

### Channel search in sidebar (YouTube-wide)
- **`Sidebar.jsx`:** Replaced the static channel list with a search input. When the query is empty, the default 7 hardcoded channels are shown. When the user types, a debounced (500 ms) call is made to `/api/channels/search?q=` which searches all of YouTube for matching channels. Results replace the static list while searching; clearing the input restores the defaults. Channel selection and now-playing preview are unchanged.
- **`Sidebar.css`:** Added styles for `.sidebar-search`, `.sidebar-search-icon`, `.sidebar-search-input`, and `.sidebar-content.searching` (loading fade).
- **`jello_backend.py`:** Added `search_channels(query)` method using the YouTube Data API v3 `/search` endpoint with `type=channel`, returning up to 10 results.
- **`server.py`:** Added `GET /api/channels/search?q=` route that calls `backend.search_channels(q)` and returns channel objects `{id, name, thumbnail, isHeader}`.

### Queue + Shuffle
- **`App.jsx`:** Added `queue`, `queueIndex`, `playSource` state (and matching refs). `handleNext`/`handlePrev` check `playSourceRef` — when `'queue'`, they navigate the queue array; otherwise they fall back to the channel songs array. Handlers: `handleAddToQueue`, `handleRemoveFromQueue`, `handleShuffleQueue` (Fisher-Yates), `handlePlayFromQueue`, `handleClearQueue`, `handleAddAllToQueue`.
- **`AlbumCard.jsx`:** Added `draggable` + `onDragStart` (serialises song to `dataTransfer`). Added "＋" overlay button that calls `onAddToQueue`.
- **`AlbumCard.css`:** Replaced `download-btn` with `.overlay-btn` shared class for add-to-queue and download buttons.
- **`AlbumGrid.jsx`:** Threads `onAddToQueue` prop through to `AlbumCard`.

### Queue Panel
- **`QueuePanel/QueuePanel.jsx`** (new): Fixed overlay above the player bar. Shows queue list with play-on-click, remove (×) buttons, Shuffle and Clear actions. Slides up with CSS animation.
- **`QueuePanel/QueuePanel.css`** (new): Panel styles, item styles, empty state.
- **`PlayerBar.jsx`:** Added `onShowQueue` prop; the album art + song title area is now clickable (cursor pointer, hover highlight) to toggle the queue panel.
- **`PlayerBar.css`:** Added `.player-left-clickable` hover style.

### Jello → Home screen
- **`Sidebar.jsx`:** `<span className="brand-jello">` now calls `onHome` on click.
- **`Sidebar.css`:** Added `cursor: pointer` + hover opacity to `.brand-jello`.
- **`App.jsx`:** `handleHome` clears `activeChannel`, `activePlaylist`, and `songs`.
- **`MainContent.jsx`:** When `mode === 'home'`, renders a centred welcome view instead of the song grid.

### Playlists (local, drag-and-drop)
- **`App.jsx`:** `playlists` state persisted in `localStorage('jello-playlists')`. Handlers: `handleCreatePlaylist`, `handleDeletePlaylist`, `handleOpenPlaylist`, `handleDropOnPlaylist`.
- **`Sidebar.jsx`:** When not searching, shows a "Playlists" section with a ＋ button (inline name input), list of playlist items (each is a drag-drop target with `onDragOver`/`onDrop`), and delete (×) button per item. After selecting a channel from search, search is cleared so sidebar switches back to showing playlists.
- **`Sidebar.css`:** Added all playlist-related styles including `.drag-over` highlight.
- **`MainContent.jsx`:** Added `mode` prop (`'home'|'channel'|'playlist'`). In `playlist` mode, search bar is hidden and an "Add all to queue" button appears. In `home` mode, renders a full-screen welcome view.
- **`MainContent.css`:** Added `.home-view`, `.add-all-btn` styles.

### Song search on the right panel
- Already existed in `MainContent.jsx` before these changes. Uses a 500 ms debounced server-side search (`/api/search/<channel_id>?q=<query>`) to filter songs within the selected channel.
