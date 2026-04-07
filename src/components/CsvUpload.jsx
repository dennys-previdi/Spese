import React, { useState } from 'react'
import { parseWalletCsv } from '../lib/csv.js'
import { supabase } from '../lib/supabase.js'

export default function CsvUpload({ accounts, onImported }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [defaultAccount, setDefaultAccount] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMsg(null)
    try {
      const text = await file.text()
      const { expenses } = parseWalletCsv(text)
      if (!expenses.length) {
        setMsg('Nessuna spesa trovata nel CSV.')
        return
      }
      // Mappa account_name -> account_id se possibile
      const byName = new Map(accounts.map((a) => [a.name.toLowerCase(), a.id]))
      const rows = expenses.map((x) => ({
        ...x,
        account_id:
          (x.account_name && byName.get(x.account_name.toLowerCase())) ||
          defaultAccount ||
          null,
      }))
      if (!supabase) {
        setMsg(`Trovate ${rows.length} spese (Supabase non configurato).`)
        return
      }
      const { error } = await supabase
        .from('expenses')
        .upsert(rows, { onConflict: 'external_id', ignoreDuplicates: true })
      if (error) throw error
      setMsg(`Importate ${rows.length} spese.`)
      onImported?.()
    } catch (err) {
      setMsg('Errore: ' + err.message)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="card">
      <h3>Importa CSV Wallet</h3>
      <div className="row">
        <label>
          Conto di default (se non riconosciuto):
          <select
            value={defaultAccount}
            onChange={(e) => setDefaultAccount(e.target.value)}
          >
            <option value="">— Nessuno —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={busy} />
      {msg && <p className="muted">{msg}</p>}
    </div>
  )
}
