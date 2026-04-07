import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Accounts({ accounts, onChange }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4f46e5')

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim() || !supabase) return
    const { error } = await supabase.from('accounts').insert({ name: name.trim(), color })
    if (!error) {
      setName('')
      onChange?.()
    }
  }

  const remove = async (id) => {
    if (!supabase) return
    if (!confirm('Eliminare il conto?')) return
    await supabase.from('accounts').delete().eq('id', id)
    onChange?.()
  }

  return (
    <div className="card">
      <h3>Conti</h3>
      <form onSubmit={add} className="row">
        <input
          placeholder="Nome conto"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button type="submit">Aggiungi</button>
      </form>
      <ul className="list">
        {accounts.map((a) => (
          <li key={a.id}>
            <span className="dot" style={{ background: a.color }} />
            {a.name}
            <button className="link" onClick={() => remove(a.id)}>
              elimina
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
