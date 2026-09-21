# Blockcraft Classic

Blockcraft Classic is an original, browser-based creative voxel sandbox. Explore a deterministic, procedurally generated landscape, build with eight distinct materials, and keep your world locally between sessions. All textures and interface artwork are generated specifically for this project.

> An original voxel sandbox game. Not affiliated with or endorsed by Mojang or Microsoft.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production check:

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
| --- | --- |
| Play World / click | Enter pointer-lock mode |
| W, A, S, D | Move |
| Mouse | Look |
| Space | Jump |
| Shift | Sprint |
| Left click | Break targeted block |
| Right click | Place selected block |
| Mouse wheel / 1–8 | Select a hotbar block |
| R | Safe respawn |
| F | Toggle FPS, coordinates, view, and seed |
| Escape | Pause and release pointer lock |

## Architecture

- **Rendering:** Three.js/WebGL with one merged opaque mesh and one merged water mesh per 16×16×64 chunk. The mesher emits only exposed faces and applies simple directional face shading through vertex colors.
- **World:** `TerrainGenerator` combines seeded, interpolated value-noise octaves for hills, plains, valleys, shorelines, and highlands. Deterministic tree placement adds trunks and canopies.
- **Streaming:** `World` loads circular rings of chunks around the player and unloads distant chunks. Near, Medium, and Far settings control view distance and fog together. Edits rebuild only their chunk and any neighbor sharing an edited boundary.
- **Player:** `Player` uses a fixed-height AABB, axis-separated collision, sub-stepped motion, gravity, jumping, and sprinting. A grid DDA performs precise voxel selection up to six blocks away.
- **Persistence:** `Storage` keeps the numeric seed, player transform, view preference, and a compact map of deviations from generated terrain in `localStorage`.
- **UI:** HTML/CSS supplies the title screen, pause settings, hotbar, crosshair, confirmation prompts, and debug display. Block sounds are synthesized at interaction time with the Web Audio API.

## Deployment

### GitHub Pages

The repository includes a GitHub Actions workflow that tests and builds the game, uploads `dist/`, and publishes it to GitHub Pages whenever `main` is updated. The Vite build uses relative asset URLs, so it works both at a project URL such as `https://YOUR-USERNAME.github.io/blockcraft-classic/` and on a custom domain.

After pushing the repository to GitHub:

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Push to `main`, or open **Actions → Deploy to GitHub Pages** and select **Run workflow**.
4. When the workflow completes, open the URL displayed by its `github-pages` deployment.

The workflow requires no deploy token or repository secret; it uses GitHub's short-lived Pages identity token and the minimum required permissions.

### Other static hosts

The app is also a standard static Vite build. Import the repository into Vercel with the default Vite settings (`npm run build`, output directory `dist`) or upload `dist/` to any static host.

## Privacy and saves

No account, analytics, backend, or network service is used. Worlds remain in the current browser's local storage. Clearing browser site data removes the saved world.
