import React, { useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from './lib/supabase.js'
import Calendar from './components/Calendar.jsx'
import CsvUpload from './components/CsvUpload.jsx'
import Accounts from './components/Accounts.jsx'
import Recurring from './components/Recurring.jsx'

export default function App() {
  const [accounts, setAccounts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [recurring, setRecurring] = useState([])
  const [tab, setTab] = useState('calendar')

  const reload = useCallback(async () => {
    if (!supabase) return
    const [a, e, r] = await Promise.all([
      supabase.from('accounts').select('*').order('name'),
      supabase.from('expenses').select('*').order('date', { ascending: false }).limit(5000),
      supabase.from('recurring_expenses').select('*').order('label'),
    ])
    setAccounts(a.data || [])
    setExpenses(e.data || [])
    setRecurring(r.data || [])
  }, [])

  useEffect(() => { reload() }, [reload])

  if (!isConfigured()) {
    return (
      <div className="container">
        <h1>Spese di Casa</h1>
        <div className="card">
          <h3>Configurazione richiesta</h3>
          <p>
            Crea un file <code>.env</code> nella root con:
          </p>
          <pre>{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...`}</pre>
          <p>
            Poi esegui lo schema in <code>supabase/schema.sql</code> nello SQL Editor di Supabase.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>Spese di Casa</h1>
        <nav className="tabs">
          <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>Calendario</button>
          <button className={tab === 'import' ? 'active' : ''} onClick={() => setTab('import')}>Importa</button>
          <button className={tab === 'recurring' ? 'active' : ''} onClick={() => setTab('recurring')}>Ricorrenti</button>
          <button className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}>Conti</button>
        </nav>
      </header>

      {tab === 'calendar' && (
        <Calendar expenses={expenses} recurring={recurring} accounts={accounts} />
      )}
      {tab === 'import' && (
        <CsvUpload accounts={accounts} onImported={reload} />
      )}
      {tab === 'recurring' && (
        <Recurring recurring={recurring} accounts={accounts} onChange={reload} />
      )}
      {tab === 'accounts' && (
        <Accounts accounts={accounts} onChange={reload} />
      )}
    </div>
  )
}
