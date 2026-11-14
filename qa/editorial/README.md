# Editorial rebuild

[Opening comparison](opening-before-after.jpg) · [Scroll recording](selected-work.webm) · [Desktop selected segments](desktop-segments-selected.png) · [Mobile selected segments](mobile-segments-selected.png) · [Mobile focus](mobile-segments-focus.png)

The text-led opening caps its layout at 1112 CSS px. The photograph holds back until it can own the full viewport. The line below the opening becomes an axis comparing 16 and 5 minutes against an eight-minute walk. It then divides three equal-priority inspection views and groups the project brief.

## Render review

The initial Counterform case heading sat too close to the sample. The final heading has its own full-width row and rule. The first ferry comparison was too light beside the headline. In the final chapter, the labels and 23 px bars balance the compact two-line title on desktop. The mobile composition gives the chart a dedicated row.

On the old home page, the inspection switches measured approximately 255 / 255 / 345 px at 1440 × 1000. On the rebuilt page they measured 370 / 370 / 370 px, all 52 px tall. At 390 × 844 they measured about 114.8 px each, with the same height and symmetric padding. Selected and focus treatments leave the widths unchanged.

## Verification

Chrome at 1440 × 1000, 1920 × 1080, 834 × 1194 and 390 × 844. Desktop media expands to the viewport and retraces the same midpoint on reversal. Mobile and reduced-motion views have a fixed full-width image and fully rendered chart. The harbor asset is an original generated still. The transition comes from scroll geometry. The two cases use fictional demo data.

`qa/check.cjs` covers keyboard and touch, both prototypes, reservation focus return, inquiry and brief, and blocked media. `qa/editorial.cjs` captures page beats and native-scale controls and checks expansion, reverse, reduced motion and geometry.
