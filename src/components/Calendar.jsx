import React, { useMemo, useState } from 'react'
import { expandRecurring } from '../lib/recurring.js'
import { isoDate, isHoliday } from '../lib/holidays.js'

const MONTHS = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre',
]
const DOW = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']

function startOfMonth(y, m) { return new Date(y, m, 1) }
function endOfMonth(y, m) { return new Date(y, m + 1, 0) }

// Heatmap: scala da chiaro a scuro in base all'importo del giorno.
function colorFor(amount, max) {
  if (!amount) return 'transparent'
  const t = Math.min(1, amount / (max || 1))
  // Interpolazione tra #eef2ff (chiaro) e #4338ca (intenso)
  const lerp = (a, b) => Math.round(a + (b - a) * t)
  const r = lerp(238, 67)
  const g = lerp(242, 56)
  const b = lerp(255, 202)
  return `rgb(${r},${g},${b})`
}

export default function Calendar({ expenses, recurring, accounts }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [filterAccount, setFilterAccount] = useState('')

  const { byDay, max } = useMemo(() => {
    const from = startOfMonth(year, month)
    const to = endOfMonth(year, month)
    const map = new Map()

    const push = (date, item) => {
      if (!map.has(date)) map.set(date, { actual: [], planned: [], total: 0 })
      const e = map.get(date)
      if (item.planned) e.planned.push(item)
      else e.actual.push(item)
      e.total += Number(item.amount) || 0
    }

    expenses.forEach((x) => {
      if (x.date < isoDate(from) || x.date > isoDate(to)) return
      if (filterAccount && x.account_id !== filterAccount) return
      push(x.date, x)
    })

    recurring.forEach((r) => {
      if (!r.active) return
      if (filterAccount && r.account_id !== filterAccount) return
      const occs = expandRecurring(r, from, to)
      occs.forEach((o) => push(o.date, o))
    })

    let max = 0
    for (const v of map.values()) if (v.total > max) max = v.total
    return { byDay: map, max }
  }, [expenses, recurring, year, month, filterAccount])

  const first = startOfMonth(year, month)
  const last = endOfMonth(year, month)
  // Lunedì = primo giorno della settimana
  const startWeekday = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const accountName = (id) => accounts.find((a) => a.id === id)?.name || ''

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1)
  }

  const sel = selectedDay && byDay.get(selectedDay)
  const monthTotal = Array.from(byDay.values()).reduce((s, v) => s + v.total, 0)

  return (
    <div className="card">
      <div className="cal-header">
        <button onClick={prev}>‹</button>
        <h3>{MONTHS[month]} {year}</h3>
        <button onClick={next}>›</button>
        <div className="spacer" />
        <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
          <option value="">Tutti i conti</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <span className="muted">Totale mese: €{monthTotal.toFixed(2)}</span>
      </div>

      <div className="cal-grid">
        {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="cal-cell empty" />
          const key = isoDate(date)
          const data = byDay.get(key)
          const isToday = isoDate(new Date()) === key
          const holiday = isHoliday(date)
          const bg = data ? colorFor(data.total, max) : 'transparent'
          return (
            <div
              key={i}
              className={`cal-cell ${isToday ? 'today' : ''} ${holiday ? 'holiday' : ''} ${selectedDay === key ? 'selected' : ''}`}
              style={{ background: bg }}
              onClick={() => setSelectedDay(key)}
            >
              <div className="cal-day-num">{date.getDate()}</div>
              {data && (
                <div className="cal-day-total">€{data.total.toFixed(0)}</div>
              )}
              {data?.planned?.length > 0 && <div className="cal-pin" title="Spesa pianificata">●</div>}
            </div>
          )
        })}
      </div>

      {sel && (
        <div className="day-detail">
          <h4>Dettaglio {selectedDay}</h4>
          {sel.actual.length === 0 && sel.planned.length === 0 && <p>Nessuna spesa.</p>}
          {sel.actual.length > 0 && (
            <>
              <h5>Effettuate</h5>
              <ul className="list">
                {sel.actual.map((x, i) => (
                  <li key={i}>
                    €{Number(x.amount).toFixed(2)} — {x.category || '—'} ·{' '}
                    {x.note || x.account_name || accountName(x.account_id)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {sel.planned.length > 0 && (
            <>
              <h5>Pianificate</h5>
              <ul className="list">
                {sel.planned.map((x, i) => (
                  <li key={i}>
                    €{Number(x.amount).toFixed(2)} — {x.label} · {accountName(x.account_id)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
