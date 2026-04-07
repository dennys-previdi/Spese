// Calcolo festività italiane e aggiustamento data per giorni festivi/weekend.

// Algoritmo di Meeus/Jones/Butcher per la Pasqua (calendario gregoriano).
function easterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const cache = new Map()

export function italianHolidays(year) {
  if (cache.has(year)) return cache.get(year)
  const easter = easterSunday(year)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)

  const fixed = [
    [1, 1],   // Capodanno
    [1, 6],   // Epifania
    [4, 25],  // Liberazione
    [5, 1],   // Festa del Lavoro
    [6, 2],   // Festa della Repubblica
    [8, 15],  // Ferragosto
    [11, 1],  // Ognissanti
    [12, 8],  // Immacolata
    [12, 25], // Natale
    [12, 26], // Santo Stefano
  ]

  const set = new Set()
  fixed.forEach(([m, d]) => set.add(isoDate(new Date(year, m - 1, d))))
  set.add(isoDate(easter))
  set.add(isoDate(easterMonday))
  cache.set(year, set)
  return set
}

export function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isHoliday(d) {
  return italianHolidays(d.getFullYear()).has(isoDate(d))
}

export function isWeekend(d) {
  const w = d.getDay()
  return w === 0 || w === 6
}

export function isNonBusiness(d) {
  return isWeekend(d) || isHoliday(d)
}

// adjust: 'none' | 'previous' | 'next'
export function adjustForHolidays(date, adjust) {
  if (adjust === 'none' || !adjust) return date
  const d = new Date(date)
  const step = adjust === 'previous' ? -1 : 1
  while (isNonBusiness(d)) {
    d.setDate(d.getDate() + step)
  }
  return d
}
