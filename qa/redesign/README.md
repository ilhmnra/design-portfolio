# Portfolio redesign verification

The old and new images show the same beats at the same browser dimensions. The previous home page is short, so its first proof and close are both visible near the end of its scroll range.

| Viewport | Opening, proof and inquiry |
| --- | --- |
| 1440 × 1000 | [Desktop comparison](desktop-before-after.jpg) |
| 834 × 1194 | [Tablet comparison](tablet-before-after.jpg) |
| 390 × 844 | [Mobile comparison](mobile-before-after.jpg) |

- **Motion** · [Recording](inspection-sequence.webm) · [First intermediate frame](sequence-01.jpg) · [Second intermediate frame](sequence-02.jpg) · [Settled](sequence-03.jpg)
- **Case openings** · Counterform [desktop](desktop-counterform.jpg) / [mobile](mobile-counterform.jpg) · Night Ferry [desktop](desktop-night-ferry.jpg) / [mobile](mobile-night-ferry.jpg)

## Browser review

Chrome 157 on Windows, 1× screenshots and touch emulation on tablet and mobile. Both editions were captured in Chrome. The new artifact was tested locally under the GitHub Pages project prefix. The routes, input modes and sequence are checked by `node qa/check.cjs` and `node qa/visual.cjs local`, with Playwright and Chrome installed as described in the [prior review](../README.md).

- The home tile selection changes the image, caption and index while the 28.4 m² lot facts stay fixed. The case reservation still rejects an out-of-range amount, returns focus after dismissal and previews the entered quantity.
- Changing Night Ferry departures via arrow keys or touch switches between 16 and 5 minutes. Save and removal still persist across reloads. The earlier trip has an 8-minute buffer after the walk.
- Desktop forward and reverse scroll reproduced the same intermediate geometry at matching positions. Wider standard-motion views animate only the decorative mark. The tested tablet and mobile sizes, and desktop with reduced motion, use both static positions. The inquiry buttons stay fixed in normal flow.
- The inquiry retains its existing public GitHub destination and the brief dialog returns focus. With WebP requests blocked the headline, sample caption, controls, and preview reservation remain usable.
- All routes were checked at all three sizes for image and font loading, layout overflow, readable content and visible focus. The first render put the traveling mark on a diagonal toward the headline. Moving the index to the right end of the caption kept the travel roughly on the same vertical line. The closing now presents the three questions directly. The opening headline follows the width of its column, preserving the three-line composition across the checked sizes.

QA covers Chrome desktop and emulated touch, with demo data and no external booking service.
