import { adjustForHolidays, isoDate } from './holidays.js'

// Genera le occorrenze di una spesa ricorrente all'interno di un intervallo [from, to].
export function expandRecurring(rule, from, to) {
  const out = []
  const start = new Date(rule.start_date)
  const end = rule.end_date ? new Date(rule.end_date) : null

  const rangeStart = from < start ? start : from
  const rangeEnd = end && end < to ? end : to

  if (rangeStart > rangeEnd) return out

  if (rule.frequency === 'monthly') {
    const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
    while (cursor <= rangeEnd) {
      const y = cursor.getFullYear()
      const m = cursor.getMonth()
      const lastDay = new Date(y, m + 1, 0).getDate()
      const day = Math.min(rule.day_of_month || 1, lastDay)
      const occurrence = new Date(y, m, day)
      if (occurrence >= start && (!end || occurrence <= end)) {
        const adjusted = adjustForHolidays(occurrence, rule.holiday_adjust)
        if (adjusted >= rangeStart && adjusted <= rangeEnd) {
          out.push(makeOccurrence(rule, adjusted))
        }
      }
      cursor.setMonth(cursor.getMonth() + 1)
    }
  } else if (rule.frequency === 'weekly') {
    const cursor = new Date(rangeStart)
    const target = rule.day_of_week ?? 1
    while (cursor.getDay() !== target) cursor.setDate(cursor.getDate() + 1)
    while (cursor <= rangeEnd) {
      if (cursor >= start && (!end || cursor <= end)) {
        const adjusted = adjustForHolidays(new Date(cursor), rule.holiday_adjust)
        out.push(makeOccurrence(rule, adjusted))
      }
      cursor.setDate(cursor.getDate() + 7)
    }
  } else if (rule.frequency === 'yearly') {
    const month = (rule.month_of_year || 1) - 1
    const day = rule.day_of_month || 1
    for (let y = rangeStart.getFullYear(); y <= rangeEnd.getFullYear(); y++) {
      const occ = new Date(y, month, day)
      if (occ < start || (end && occ > end)) continue
      const adjusted = adjustForHolidays(occ, rule.holiday_adjust)
      if (adjusted >= rangeStart && adjusted <= rangeEnd) {
        out.push(makeOccurrence(rule, adjusted))
      }
    }
  }
  return out
}

function makeOccurrence(rule, date) {
  return {
    date: isoDate(date),
    amount: Number(rule.amount),
    label: rule.label,
    category: rule.category,
    account_id: rule.account_id,
    recurring_id: rule.id,
    planned: true,
  }
}
