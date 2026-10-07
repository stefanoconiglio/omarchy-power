# Log

One dated entry per working session: what changed, decisions and who made them, open questions.
The machine-side record (shell.json, backups, inventory) is in omarchy-customizations' LOG.md.

## 2026-10-06 19:20 CEST — The pill

Request (user): Omarchy's battery widget (one glyph) is not great; show it like the PingScope
pill, with the charge left and the charge / discharge rate.

- `omarchy plugin clone omarchy.power` (Omarchy 4.0.4) → id `coniglio.power`,
  `clonedFrom: omarchy.power`; first commit, unchanged. `moduleName` and `ipcTarget` stay
  `omarchy.power`, so the menu and `omarchy-shell omarchy.power …` reach the clone (checked).
- Panel.qml: the BarIconButton face replaced by PingScope's pill (fill `#18181b`, outline in the
  bar's text colour, bold `Style.font.title`, ink centred with TextMetrics.tightBoundingRect,
  width from "100% −88 W", or "100%" with the rate hidden). Colour by level: `#22c55e`,
  `#eab308` below 30%, `#ef4444` below 15%. Right-click and IPC `togglePercentage` (the menu's
  "Battery Percentage") flip the `showRate` setting; new IPC `toggleRate`. Tooltip: mean and
  latest rate, time left = energy ÷ mean rate.
- Model.js: `parseSysfsPower`, `pushSample`, `mean`, `levelStatus`, `flowing`, `faceLabel`,
  `secondsLeft`, `formatDuration`; checked with node asserts on every label state.
- Rate: `grep -sH .` over `/sys/class/power_supply/BAT*/{status,power_now,current_now,voltage_now}`
  every 2 s, mean of the last 30 s, restarted on a change of direction. Measured on the HP
  (BAT0, no `power_now`): 15.1, 12.5, 12.6, 11.3, 15.4, 13.0, 19.6, 12.8, 14.0, 12.8 W one second
  apart; UPower's `energy-rate`, ~30 s apart: 12.1, 18.7, 11.2, 13.4 W. UPower's `timeToEmpty`
  (2 h 30 min while the mean was 20.1 W) disagreed with the rate on the pill, hence energy ÷ mean.
- Checked on the live bar, screenshots: discharging live; charging, full, held, 22% (yellow),
  8% (red) and no-reading states forced through a temporary IPC hook, since removed, all the
  same width; the toggle both ways; the panel under the pill; the tooltip text (25.5 Wh ÷
  21.4 W = "About 1 h 12 min left").
- Mistake, corrected (reported by the user): hovering showed no tooltip. The bar shows one only
  while the target has `tooltipHovered === true` (Bar.qml, `targetTooltipHovered`), which
  WidgetButton provides and the hand-made face did not. Added
  `tooltipHovered: faceMouse.containsMouse`; the user confirmed the tooltip shows. The PingScope
  face, where the pill code came from, has the same gap.
- Not checked: a real charge with AC plugged in; a vertical bar.
- Reloading: the shell logs "Local plugin changed, reloading" but keeps the old face until
  `omarchy restart shell`.
- Decision (user): own public repository, github.com/stefanoconiglio/omarchy-power, symlinked
  into `~/.config/omarchy/plugins/coniglio.power`.

## 2026-10-07 18:37 CEST — Outline instead of the dark pill; colours from the theme

Request (user): drop the dark fill; keep only the outline, softer, as a border grouping the items
of one tool, the same on the battery, ping, Memory and Agents widgets. Normal values must stay
readable on every theme. Decisions (user): softer outline; thresholds ping orange 50–100 ms, red
from 100 ms and down; battery orange below 30%, red below 15%; Agents orange from 80%, red from
90%; Memory orange from warnPercent (85), red from 90%.

- Attention.js / Attention.qml, the same in each of the four plugins: normal text in the bar's
  colour; the outline that colour at 45% opacity; orange and red from the theme's colors.toml
  (`~/.local/state/omarchy/current/theme`) when they really are orange (hue 12–45°) or red
  (340–12°) with HSV saturation at least 0.35, otherwise #f97316 / #ef4444; then darkened (light
  bar) or lightened (dark bar) in 5% steps until 3:1 against the bar background (`bar.background`;
  a transparent bar assumed black or white, opposite to its text). Reloaded when the file changes
  and when the shell's theme colours change (theme-set sends them over IPC).
- Measured on the 22 stock themes, contrast of the fixed colours against each bar background:
  green #22c55e 2.0–2.3:1 on the five light themes, red #dc2626 2.6:1 on everforest and nord.
  Theme colours as named: red 2.3:1 on miasma, 2.8:1 on solitude, orange 2.8:1 on rose-pine; and
  several are not orange or red at all (hackerman green, vantablack and white grey, lumon blue,
  lupine blue and magenta, matte-black orange = a red). After the rules: every orange and red at
  3.05:1 or more, orange and red at least 16° of hue apart.
- Checked on the live bar (rose-pine, light): all four outlined, no QML error; with temporary IPC
  hooks (removed) forcing values: normal, orange #c57a53 (theme orange, raised from 2.8 to 3.1:1)
  and red #b4637a (theme red) on all four. Not seen on a dark theme (the user's theme was not
  changed).
- Here: the dark fill and the fixed green/yellow/red replaced; README and preview.
