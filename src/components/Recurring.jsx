import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const empty = {
  label: '',
  amount: '',
  category: '',
  account_id: '',
  frequency: 'monthly',
  day_of_month: 1,
  day_of_week: 1,
  month_of_year: 1,
  holiday_adjust: 'none',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  active: true,
}

export default function Recurring({ recurring, accounts, onChange }) {
  const [form, setForm] = useState(empty)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!supabase) return
    const payload = {
      ...form,
      amount: Number(form.amount),
      day_of_month: form.frequency === 'weekly' ? null : Number(form.day_of_month),
      day_of_week: form.frequency === 'weekly' ? Number(form.day_of_week) : null,
      month_of_year: form.frequency === 'yearly' ? Number(form.month_of_year) : null,
      end_date: form.end_date || null,
      account_id: form.account_id || null,
    }
    const { error } = await supabase.from('recurring_expenses').insert(payload)
    if (!error) {
      setForm(empty)
      onChange?.()
    } else {
      alert(error.message)
    }
  }

  const remove = async (id) => {
    if (!supabase) return
    if (!confirm('Eliminare la ricorrenza?')) return
    await supabase.from('recurring_expenses').delete().eq('id', id)
    onChange?.()
  }

  return (
    <div className="card">
      <h3>Spese ricorrenti</h3>
      <form onSubmit={submit} className="grid">
        <input
          placeholder="Etichetta (es. Affitto)"
          value={form.label}
          onChange={(e) => set('label', e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Importo €"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          required
        />
        <input
          placeholder="Categoria"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        />
        <select value={form.account_id} onChange={(e) => set('account_id', e.target.value)}>
          <option value="">— Conto —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
          <option value="monthly">Mensile</option>
          <option value="weekly">Settimanale</option>
          <option value="yearly">Annuale</option>
        </select>
        {form.frequency === 'monthly' && (
          <input
            type="number"
            min="1"
            max="31"
            value={form.day_of_month}
            onChange={(e) => set('day_of_month', e.target.value)}
            placeholder="Giorno mese"
          />
        )}
        {form.frequency === 'weekly' && (
          <select
            value={form.day_of_week}
            onChange={(e) => set('day_of_week', e.target.value)}
          >
            <option value="1">Lunedì</option>
            <option value="2">Martedì</option>
            <option value="3">Mercoledì</option>
            <option value="4">Giovedì</option>
            <option value="5">Venerdì</option>
            <option value="6">Sabato</option>
            <option value="0">Domenica</option>
          </select>
        )}
        {form.frequency === 'yearly' && (
          <>
            <input
              type="number"
              min="1"
              max="12"
              value={form.month_of_year}
              onChange={(e) => set('month_of_year', e.target.value)}
              placeholder="Mese"
            />
            <input
              type="number"
              min="1"
              max="31"
              value={form.day_of_month}
              onChange={(e) => set('day_of_month', e.target.value)}
              placeholder="Giorno"
            />
          </>
        )}
        <select
          value={form.holiday_adjust}
          onChange={(e) => set('holiday_adjust', e.target.value)}
          title="Se la data cade in un giorno festivo o weekend"
        >
          <option value="none">Nessun aggiustamento</option>
          <option value="previous">Giorno lavorativo precedente</option>
          <option value="next">Giorno lavorativo successivo</option>
        </select>
        <label className="muted">
          Inizio
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => set('start_date', e.target.value)}
          />
        </label>
        <label className="muted">
          Fine (opz.)
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => set('end_date', e.target.value)}
          />
        </label>
        <button type="submit">Aggiungi ricorrenza</button>
      </form>

      <ul className="list">
        {recurring.map((r) => (
          <li key={r.id}>
            <strong>{r.label}</strong> — €{Number(r.amount).toFixed(2)} ·{' '}
            {r.frequency === 'monthly' && `mensile g.${r.day_of_month}`}
            {r.frequency === 'weekly' && `settimanale g.${r.day_of_week}`}
            {r.frequency === 'yearly' && `annuale ${r.day_of_month}/${r.month_of_year}`}
            {r.holiday_adjust !== 'none' && ` · ${r.holiday_adjust === 'previous' ? '←' : '→'} festivi`}
            <button className="link" onClick={() => remove(r.id)}>
              elimina
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
