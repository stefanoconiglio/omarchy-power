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
