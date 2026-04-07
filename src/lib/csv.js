import Papa from 'papaparse'

// Parser per CSV esportati dall'app "Wallet" (BudgetBakers).
// I CSV di Wallet hanno tipicamente colonne come:
//   account, category, currency, amount, ref. currency amount, type,
//   note, date, payee, labels, envelopes, payment type
// Il parser è tollerante e cerca le colonne tramite alias.

const FIELD_ALIASES = {
  date: ['date', 'data'],
  amount: ['amount', 'importo'],
  currency: ['currency', 'valuta'],
  category: ['category', 'categoria'],
  account: ['account', 'conto'],
  note: ['note', 'noteline', 'note line', 'descrizione', 'description'],
  payee: ['payee', 'beneficiario'],
  type: ['type', 'tipo'],
}

function pick(row, key) {
  const aliases = FIELD_ALIASES[key] || [key]
  for (const alias of aliases) {
    for (const k of Object.keys(row)) {
      if (k.trim().toLowerCase() === alias) return row[k]
    }
  }
  return undefined
}

function parseAmount(raw) {
  if (raw == null) return NaN
  let s = String(raw).trim()
  if (!s) return NaN
  // Rimuovi simboli valuta e spazi
  s = s.replace(/[€$£\s]/g, '')
  // Gestione formati IT/EU: "1.234,56" -> "1234.56"
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  return parseFloat(s)
}

function parseDate(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  // ISO yyyy-mm-dd
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  // dd/mm/yyyy o dd-mm-yyyy
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // mm/dd/yyyy fallback
  const d = new Date(s)
  if (!isNaN(d)) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return null
}

export function parseWalletCsv(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: '', // auto-detect
  })
  const rows = result.data || []
  const expenses = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const date = parseDate(pick(row, 'date'))
    const amount = parseAmount(pick(row, 'amount'))
    if (!date || isNaN(amount)) continue
    // In Wallet, le spese sono importi negativi e i ricavi positivi.
    // Filtriamo solo le spese.
    if (amount >= 0) continue
    const category = pick(row, 'category') || null
    const account = pick(row, 'account') || null
    const note = pick(row, 'note') || pick(row, 'payee') || null
    const currency = pick(row, 'currency') || 'EUR'
    const externalId = `wallet:${date}:${amount}:${(account || '').trim()}:${(note || '').trim()}:${i}`
    expenses.push({
      date,
      amount: Math.abs(amount),
      currency,
      category,
      account_name: account,
      note,
      source: 'wallet_csv',
      external_id: externalId,
    })
  }
  return { expenses, errors: result.errors }
}
