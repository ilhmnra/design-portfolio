# Browser review

Verified in Chrome 157.0.8103.51 through Playwright, with 1× device scale. The local test server mounted the site under `/design-portfolio/`. The repeat run used the [published GitHub Pages site](https://ilhmnra.github.io/design-portfolio/) after [deployment 43547721457](https://github.com/ilhmnra/design-portfolio/actions/runs/43547721457) succeeded.

| Viewport | Home | Counterform | Night Ferry |
| --- | --- | --- | --- |
| Desktop · 1440 × 1000 | [PNG](screenshots/home-desktop.png) | [PNG](screenshots/counterform-desktop.png) | [PNG](screenshots/night-ferry-desktop.png) |
| Tablet · 834 × 1194 | [PNG](screenshots/home-tablet.png) | [PNG](screenshots/counterform-tablet.png) | [PNG](screenshots/night-ferry-tablet.png) |
| Mobile · 390 × 844 | [PNG](screenshots/home-mobile.png) | [PNG](screenshots/counterform-mobile.png) | [PNG](screenshots/night-ferry-mobile.png) |

### Results

- **Layout and assets.** All three routes returned HTTP 200 at each target viewport. Font and image loads completed, the document showed no horizontal overflow, and visible prototype buttons met the 44 px minimum height. Reviewed the screenshots for type, crops, and control placement. The exported PNGs were reopened and their pixel dimensions verified.
- **Home.** Counterform opened from the selected-work card by keyboard and touch emulation. The project brief offered clipboard copy or text selection and returned focus when dismissed with Escape. The inquiry destination is the public repository’s new issue page, which asks signed-out visitors to sign in. The page labels the inquiry as public.
- **Counterform.** Surface, Edge, and Installed scale updated the photo and caption. The sample reservation rejected quantities over 28.4 m². A 12.5 m² preview completed and returned focus to the action. Escape and the touch close button both dismissed the dialog and restored focus. [Edge inspection](screenshots/counterform-edge.png).
- **Night Ferry.** Arrow keys and touch changed the transfer result from 16 minutes to 5 minutes. The later option showed “Too tight” next to its 8-minute walk estimate. Save and removal persisted after reload. [Tight connection](screenshots/night-ferry-tight.png).
- **Motion and missing media.** The selected Counterform photo used a measured 220 ms animation under standard motion and no animation under reduced motion. Night Ferry’s 180 ms background transition computed to 0 s under reduced motion. Blocking the WebP images left the image slot, descriptive caption, and reservation action usable.
- **Contrast.** Spot checks used WCAG relative luminance for the declared colors. Portfolio body copy measured 6.40:1, Counterform metadata 6.86:1 and Night Ferry’s selected departure 7.14:1. Both transfer text colors maintained at least 9.26:1 across a 101-step interpolation between the panel backgrounds.

Tests were run in Chrome with emulated touch. These checks did not measure real-user performance or cover other browsers and physical devices.

### Rerun

With Node.js and Chrome installed, run `npm install --no-save --no-package-lock playwright` from the repository. Run `node qa/check.cjs` locally, or append the live URL to test the deployment. Add `--capture` to regenerate the screenshots.
