# Spese di Casa

Web app per gestire le spese di casa con vista calendario heatmap, importazione CSV dall'app **Wallet** (BudgetBakers), spese ricorrenti con aggiustamento per festività italiane e supporto multi-conto.

Stack: **React + Vite** (frontend), **Supabase** (database), deploy su **Vercel**.

## Funzionalità

- Calendario mensile con colorazione **heatmap** in base al totale speso ogni giorno.
- Marker delle festività italiane (festività nazionali + Pasqua/Pasquetta).
- Click su un giorno per vedere le spese effettuate e quelle pianificate.
- **Importazione CSV** dall'app Wallet con dedup tramite `external_id`.
- **Spese ricorrenti** mensili / settimanali / annuali con possibilità di:
  - Spostare la data al giorno lavorativo **precedente** o **successivo** in caso di festivo o weekend.
- **Conti multipli** (carta, contanti, conto corrente, ...) con filtro nel calendario.

## Setup

### 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Apri lo **SQL Editor** ed esegui il contenuto di `supabase/schema.sql`.
3. In *Project Settings → API* prendi nota di `Project URL` e `anon public key`.

### 2. Variabili d'ambiente

Copia `.env.example` in `.env` e compila:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

### 3. Sviluppo locale

```bash
npm install
npm run dev
```

### 4. Deploy su Vercel

1. Crea un nuovo progetto Vercel collegato a questo repo.
2. Imposta le stesse variabili d'ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Vercel rileva automaticamente Vite (vedi `vercel.json`).

## Importazione CSV Wallet

L'app Wallet (BudgetBakers) esporta CSV con colonne tipo `date`, `amount`, `category`, `account`, `note`, `currency`. Il parser è tollerante:

- Riconosce sia formati ISO (`YYYY-MM-DD`) sia formati italiani (`DD/MM/YYYY`).
- Riconosce numeri sia in formato `1.234,56` sia `1234.56`.
- Importa solo le **spese** (importi negativi), ignora le entrate.
- Mappa automaticamente il nome del conto Wallet su un conto esistente in app (case-insensitive). Se non trovato, usa il "conto di default" selezionato in fase di import.
- Dedup tramite `external_id` (combinazione di data, importo, conto, nota).

## Spese ricorrenti

Per ogni ricorrenza puoi specificare:

- **Frequenza**: mensile, settimanale o annuale
- **Giorno**: del mese (1-31), della settimana o data esatta (per annuali)
- **Aggiustamento festività**:
  - *Nessuno*: lascia la data così com'è
  - *Giorno lavorativo precedente*: se cade in weekend o festa, sposta indietro
  - *Giorno lavorativo successivo*: sposta avanti
- **Periodo di validità** con data inizio e (opzionale) data fine
- **Conto** di addebito

Le occorrenze sono calcolate al volo nel calendario (non vengono materializzate nel DB), quindi puoi modificare la regola in qualsiasi momento.

## Note sulla sicurezza

In questo MVP la RLS è **disabilitata** (uso single-user). Per uso multi-utente abilita Auth in Supabase, attiva RLS sulle tabelle e aggiungi una colonna `user_id` con policy `auth.uid() = user_id`.

## Struttura

```
src/
├── App.jsx
├── main.jsx
├── styles.css
├── components/
│   ├── Calendar.jsx        # vista calendario heatmap
│   ├── CsvUpload.jsx       # importazione CSV Wallet
│   ├── Accounts.jsx        # gestione conti
│   └── Recurring.jsx       # gestione spese ricorrenti
└── lib/
    ├── supabase.js         # client supabase
    ├── csv.js              # parser CSV Wallet
    ├── holidays.js         # festività italiane + adjust
    └── recurring.js        # espansione ricorrenze
supabase/
└── schema.sql              # schema DB
```
