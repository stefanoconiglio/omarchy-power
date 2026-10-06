function clampIndex(index, length) {
  if (length <= 0) return 0
  return Math.max(0, Math.min(length - 1, index))
}

function selectProfileIndex(index, delta, profiles) {
  var values = Array.isArray(profiles) ? profiles : []
  if (values.length === 0) return 0
  return clampIndex(index + delta, values.length)
}

function parseKeyValue(raw) {
  var next = {}
  var lines = String(raw || "").split("\n")
  for (var i = 0; i < lines.length; i++) {
    var idx = lines[i].indexOf("\t")
    if (idx <= 0) continue
    next[lines[i].substring(0, idx)] = lines[i].substring(idx + 1).trim()
  }
  return next
}

function parseProfiles(raw, previousIndex) {
  var lines = String(raw || "").split("\n")
  var list = []
  var active = ""
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (!line) continue
    var parts = line.split("\t")
    list.push(parts[0])
    if (parts[1] === "1") active = parts[0]
  }
  return {
    profiles: list,
    activeProfile: active,
    profileIndex: clampIndex(previousIndex || 0, list.length)
  }
}

function profileIcon(name) {
  if (name === "power-saver") return "󰌪"
  if (name === "balanced") return "󰊚"
  if (name === "performance") return "󰓅"
  return "󰂄"
}

function batteryFraction(device) {
  return device && device.isPresent ? Math.max(0, Math.min(1, device.percentage)) : 0
}

function chargeThresholdActive(device, onBattery, states) {
  var d = device || {}
  var s = states || {}
  if (!(d && d.isPresent && !onBattery)) return false

  var fraction = batteryFraction(d)
  if (d.state === s.Discharging) return false
  if (d.state === s.PendingCharge) return true
  if (d.state === s.FullyCharged && fraction < 0.99) return true
  if (d.state !== s.Charging || fraction >= 0.99) return false

  return Number(d.changeRate || 0) <= 0.2 || Number(d.timeToFull || 0) >= 8 * 60 * 60
}

function batteryIcon(device, onBattery, states) {
  var d = device || {}
  if (!d.isPresent) return ""

  var chargingIcons = ["󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰂉", "󰢞", "󰂊", "󰂋", "󰂅"]
  var defaultIcons = ["󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"]
  var index = Math.max(0, Math.min(9, Math.floor(d.percentage * 10)))
  var threshold = chargeThresholdActive(d, onBattery, states)

  if (threshold) return defaultIcons[index]
  if (d.state === states.FullyCharged) return "󰂅"
  if (!onBattery) return chargingIcons[index]
  return defaultIcons[index]
}

function modeLabel(device, onBattery, states) {
  var d = device || {}
  if (!d.isPresent) return ""

  var percentage = d.isPresent ? d.percentage : 0
  if (chargeThresholdActive(d, onBattery, states)) return "Threshold"
  if (onBattery) return "On battery"
  if (!onBattery && percentage >= 1) return "Fully charged"
  return "Charging"
}

// ---------- bar pill: level and power flow ----------

// Power through the batteries, from `grep -H .` over each one's sysfs
// status, power_now (µW), current_now (µA) and voltage_now (µV). The
// direction comes from status: some drivers sign current_now, others don't.
// Returns null when no battery answered.
function parseSysfsPower(raw) {
  var batteries = {}
  var lines = String(raw || "").split("\n")
  for (var i = 0; i < lines.length; i++) {
    var match = /^(.*)\/([a-z_]+):(.*)$/.exec(lines[i])
    if (!match) continue
    var entry = batteries[match[1]] || (batteries[match[1]] = {})
    entry[match[2]] = match[3].trim()
  }

  var watts = 0
  var found = false
  var charging = false
  var discharging = false
  for (var path in batteries) {
    var b = batteries[path]
    if (b.status === undefined) continue
    found = true
    if (b.status === "Charging") charging = true
    else if (b.status === "Discharging") discharging = true

    var w = 0
    if (b.power_now !== undefined) w = Number(b.power_now) / 1e6
    else if (b.current_now !== undefined && b.voltage_now !== undefined)
      w = Number(b.current_now) * Number(b.voltage_now) / 1e12
    if (isFinite(w)) watts += Math.abs(w)
  }
  if (!found) return null
  return {
    watts: watts,
    direction: discharging ? "discharging" : (charging ? "charging" : "idle")
  }
}

// The last maxSamples readings, newest last.
function pushSample(samples, watts, maxSamples) {
  var next = (Array.isArray(samples) ? samples : []).concat([watts])
  return next.length > maxSamples ? next.slice(next.length - maxSamples) : next
}

function mean(samples) {
  if (!Array.isArray(samples) || samples.length === 0) return null
  var sum = 0
  for (var i = 0; i < samples.length; i++) sum += samples[i]
  return sum / samples.length
}

// Green, yellow, red by charge left; Omarchy's own warning comes at 10%.
function levelStatus(percent) {
  if (percent < 15) return "bad"
  if (percent < 30) return "warning"
  return "good"
}

// Whether power is flowing in or out at a rate worth showing. A battery held
// at its charge limit reports Charging at a fraction of a watt.
function flowing(direction, watts) {
  if (watts === null || watts === undefined) return false
  if (direction === "discharging") return true
  return direction === "charging" && watts >= 0.5
}

// "84% −13 W" on battery, "62% +25 W" charging, "100% 󰚥" on AC with nothing
// flowing, "84%" with the rate hidden; the bare number on a vertical bar.
function faceLabel(percent, watts, direction, onBattery, showRate, vertical) {
  var level = Math.round(percent)
  if (vertical) return String(level)
  var label = level + "%"
  if (!showRate) return label
  if (watts === null || watts === undefined) return label + " …"
  if (flowing(direction, watts)) {
    var sign = direction === "charging" ? "+" : "−"
    return label + " " + sign + Math.max(1, Math.round(watts)) + " W"
  }
  return onBattery ? label : label + " 󰚥"
}

// Seconds to empty, or to full, at the given rate. UPower's own estimate uses
// its single latest reading, so it can disagree with the mean on the pill.
function secondsLeft(direction, energyWh, capacityWh, watts) {
  if (!(watts > 0)) return 0
  var wh = direction === "charging" ? capacityWh - energyWh : energyWh
  return wh > 0 ? wh / watts * 3600 : 0
}

function formatDuration(seconds) {
  var s = Number(seconds)
  if (!isFinite(s) || s <= 0) return ""
  var minutes = Math.round(s / 60)
  var h = Math.floor(minutes / 60)
  var m = minutes % 60
  if (h === 0) return m + " min"
  return h + " h " + (m < 10 ? "0" : "") + m + " min"
}

if (typeof module !== "undefined") {
  module.exports = {
    parseSysfsPower: parseSysfsPower,
    pushSample: pushSample,
    mean: mean,
    levelStatus: levelStatus,
    flowing: flowing,
    faceLabel: faceLabel,
    secondsLeft: secondsLeft,
    formatDuration: formatDuration,
    clampIndex: clampIndex,
    selectProfileIndex: selectProfileIndex,
    parseKeyValue: parseKeyValue,
    parseProfiles: parseProfiles,
    profileIcon: profileIcon,
    batteryFraction: batteryFraction,
    chargeThresholdActive: chargeThresholdActive,
    batteryIcon: batteryIcon,
    modeLabel: modeLabel
  }
}
