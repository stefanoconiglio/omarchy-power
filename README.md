# Power, in an outline

An Omarchy shell widget: Omarchy's own Power widget with another face in the
bar. Instead of a battery glyph, it shows the charge left and the power
flowing out of the battery or into it, inside a soft outline.

![The widget at the right end of the bar](preview.png)

| Face        | Meaning                                           |
|-------------|---------------------------------------------------|
| `84% −13 W` | on battery, drawing 13 W                          |
| `62% +25 W` | charging at 25 W                                  |
| `100% 󰚥`    | on AC, nothing flowing (full, or held at a limit) |
| `84% …`     | no power reading yet                              |

The text is in the bar's own colour, orange below 30% and red below 15%
(Omarchy's own low-battery warning comes at 10%). The outline, in the bar's
text colour at half strength, marks what belongs to the widget. Its width
never changes, so the widgets next to it never move.

The colours follow the theme (`Attention.qml`, `Attention.js`): the theme's
own orange and red when it has real ones, a standard orange and red where
it doesn't (some themes give those names to green, grey or blue), either one
darkened or lightened just enough to read at 3:1 against the bar. Checked on
Omarchy's 22 stock themes.

- **Hover**: the rate to a tenth of a watt, the latest reading, and the time
  left at that rate.
- **Left click**: Omarchy's Power panel, unchanged (charge, time left, power
  profiles).
- **Right click**: hide or show the rate; the face then shows the percentage
  only. Omarchy's menu item "Battery Percentage" does the same.

## The rate

Every 2 s the widget reads `/sys/class/power_supply/BAT*/`: `power_now`
where the battery has it, `current_now × voltage_now` where it doesn't, and
the direction from `status`. The face shows the mean of the last 30 s,
restarted whenever the battery switches between charging and discharging.
One-second readings jump by several watts (11 to 20 W on the HP laptop this
was written on), and UPower's rate updates about every 30 s and jumps as
much, so a single reading would be unreadable.

Right after `omarchy restart shell` the mean runs high for half a minute: the
restart's own load.

## Install

```bash
omarchy plugin add https://github.com/stefanoconiglio/omarchy-power.git --enable
```

The widget declares itself a clone of `omarchy.power`, so enabling it puts it
in place of Omarchy's Power widget, with that widget's settings, and calls to
`omarchy.power` (the menu, `omarchy-shell omarchy.power toggle`) reach it.
To go back to Omarchy's widget:

```bash
omarchy plugin remove coniglio.power
```

Requires Omarchy 4 (the Quickshell-based `omarchy-shell`).

## Settings

| Setting    | Default | Meaning                                  |
|------------|---------|------------------------------------------|
| `showRate` | `true`  | `false` shows the percentage only        |

Right click flips it; it is saved in the widget's entry in
`~/.config/omarchy/shell.json`.

## Built from Omarchy's widget

The first commit is `omarchy plugin clone omarchy.power` from Omarchy 4.0.4,
unchanged; everything since is the new face. When an Omarchy update changes
`/usr/share/omarchy/shell/plugins/panels/power/`, compare it with that first
commit and merge the difference here.

After editing the files, `omarchy restart shell`: the shell reports the
change, but keeps the old face until it restarts.

## License

MIT, as Omarchy. See [LICENSE](LICENSE).
