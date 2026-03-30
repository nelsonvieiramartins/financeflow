// FinanceFlow — Seed script para Nelson Vieira (Abril 2026)
// Rodar com: node scripts/seed.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://wfoakpdgycgschxiyhuk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmb2FrcGRneWNnc2NoeGl5aHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjczNzEsImV4cCI6MjA5MDQwMzM3MX0.WUfF5kVqNF08J3f35_4ob31_29tc20vd7O6gcNxNAtE'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// -----------------------------------------------
// DADOS EXTRAÍDOS DA PLANILHA — ABRIL 2026
// -----------------------------------------------

const MONTH = 4
const YEAR = 2026

const GASTOS_FIXOS_PIX = [
  { description: 'Airbnb Rio',       amount: 132.52,  category: 'viagem',       due_date: '2026-04-01' },
  { description: 'IPVA',             amount: 306.93,  category: 'transporte',   due_date: '2026-10-01' },
  { description: 'Aviva',            amount: 200.00,  category: 'viagem',       due_date: null },
  { description: 'Seguro do carro',  amount: 173.29,  category: 'transporte',   due_date: '2026-04-01' },
  { description: 'Complemento Carro', amount: 41.00,  category: 'transporte',  due_date: '2028-07-01' },
]

const GASTOS_FIXOS_CARTAO = [
  { description: 'Academia',             amount: 199.90,  category: 'saude',          due_date: null },
  { description: 'Plano Luke',           amount: 109.44,  category: 'saude',          due_date: null },
  { description: 'Google',               amount: 14.99,   category: 'entretenimento', due_date: null },
  { description: 'Apple',                amount: 19.90,   category: 'entretenimento', due_date: null },
  { description: 'Amazon',               amount: 23.90,   category: 'entretenimento', due_date: null },
  { description: 'Apple TV',             amount: 29.90,   category: 'entretenimento', due_date: null },
  { description: 'Assinatura Nelson',    amount: 72.00,   category: 'entretenimento', due_date: null },
  { description: 'Passagem Chile',       amount: 250.26,  category: 'viagem',         due_date: '2027-01-01' },
  { description: 'Inglês',              amount: 39.93,   category: 'entretenimento', due_date: '2026-10-01' },
  { description: 'Shein',               amount: 78.88,   category: 'beleza',         due_date: '2026-06-01' },
  { description: 'Depilação Laser',     amount: 59.90,   category: 'beleza',         due_date: '2026-06-01' },
  { description: 'Mounjaro',            amount: 564.56,  category: 'saude',          due_date: '2026-05-01' },
  { description: 'Presente Mãe',        amount: 41.77,   category: 'entretenimento', due_date: '2026-04-01' },
  { description: 'Passagem Casamento',  amount: 148.08,  category: 'viagem',         due_date: '2026-04-01' },
  { description: 'Airbnb Ribeirão',     amount: 124.16,  category: 'viagem',         due_date: '2026-04-01' },
]

const GASTOS_VARIAVEIS = [
  { description: 'Fisioterapia',    amount: 220.00,  category: 'saude'          },
  { description: 'Saídas',          amount: 197.44,  category: 'entretenimento' },
  { description: 'Alimentação',     amount: 150.00,  category: 'alimentacao'    },
  { description: 'Compras',         amount: 79.84,   category: 'compras'        },
  { description: 'Carro (variável)', amount: 240.69, category: 'transporte'     },
]

const RECEITAS = [
  { description: 'Salário',  amount: 5200.00, source: 'salario'  },
  { description: 'Flash',    amount: 638.00,  source: 'beneficio' },
]

const INVESTIMENTOS = [
  { description: 'Cofrinho', amount: 500.00 },
]

const A_RECEBER = [
  { from_person: 'Pai',    description: 'Carro (pai)',           amount: 1350.00 },
  { from_person: 'Mãe',   description: 'Airbnb + Mounjaro',     amount: 323.67  },
  { from_person: 'Nelson', description: 'Assinatura + Presente', amount: 155.16 },
]

// -----------------------------------------------

async function seed() {
  console.log('🌱 Iniciando seed para Nelson Vieira — Abril 2026...\n')

  // 1. Sign up / Sign in
  const email = 'nelson@financeflow.app'
  const password = 'Nelson@2026'
  const name = 'Nelson Vieira'

  let userId

  console.log('1. Criando conta...')
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (signUpError) {
    console.log('   Conta já existe, fazendo login...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      console.error('❌ Erro no login:', signInError.message)
      console.log('\n💡 Certifique-se de desabilitar "Confirm email" em Supabase → Auth → Providers → Email')
      process.exit(1)
    }
    userId = signInData.user.id
    console.log('   ✅ Login OK:', userId)
  } else if (signUpData.user) {
    userId = signUpData.user.id
    if (!signUpData.session) {
      console.log('\n⚠️  Email de confirmação enviado. Precisa desabilitar "Confirm email" em:')
      console.log('   Supabase → Authentication → Providers → Email → desativar "Confirm email" → Save')
      console.log('\n   Depois rode este script novamente.')
      process.exit(0)
    }
    console.log('   ✅ Conta criada:', userId)
  }

  console.log('\n2. Inserindo gastos fixos Pix/Boleto...')
  const pixRows = GASTOS_FIXOS_PIX.map((e, i) => ({
    user_id: userId, month: MONTH, year: YEAR,
    payment_type: 'pix_boleto', is_recurring: true, sort_order: i,
    notes: null, ...e,
  }))
  const { error: e1 } = await supabase.from('expenses').insert(pixRows)
  if (e1) console.error('   ❌', e1.message)
  else console.log(`   ✅ ${pixRows.length} lançamentos`)

  console.log('\n3. Inserindo gastos fixos Cartão...')
  const cartaoRows = GASTOS_FIXOS_CARTAO.map((e, i) => ({
    user_id: userId, month: MONTH, year: YEAR,
    payment_type: 'cartao_fixo', is_recurring: true, sort_order: i,
    notes: null, ...e,
  }))
  const { error: e2 } = await supabase.from('expenses').insert(cartaoRows)
  if (e2) console.error('   ❌', e2.message)
  else console.log(`   ✅ ${cartaoRows.length} lançamentos`)

  console.log('\n4. Inserindo gastos variáveis...')
  const varRows = GASTOS_VARIAVEIS.map((e, i) => ({
    user_id: userId, month: MONTH, year: YEAR,
    payment_type: 'variavel', is_recurring: false, sort_order: i,
    due_date: null, notes: null, ...e,
  }))
  const { error: e3 } = await supabase.from('expenses').insert(varRows)
  if (e3) console.error('   ❌', e3.message)
  else console.log(`   ✅ ${varRows.length} lançamentos`)

  console.log('\n5. Inserindo receitas...')
  const incomeRows = RECEITAS.map(r => ({
    user_id: userId, month: MONTH, year: YEAR, notes: null, ...r,
  }))
  const { error: e4 } = await supabase.from('income').insert(incomeRows)
  if (e4) console.error('   ❌', e4.message)
  else console.log(`   ✅ ${incomeRows.length} lançamentos`)

  console.log('\n6. Inserindo investimentos...')
  const invRows = INVESTIMENTOS.map(inv => ({
    user_id: userId, month: MONTH, year: YEAR, notes: null, ...inv,
  }))
  const { error: e5 } = await supabase.from('investments').insert(invRows)
  if (e5) console.error('   ❌', e5.message)
  else console.log(`   ✅ ${invRows.length} lançamentos`)

  console.log('\n7. Inserindo valores a receber...')
  const recRows = A_RECEBER.map(r => ({
    user_id: userId, month: MONTH, year: YEAR, received: false, ...r,
  }))
  const { error: e6 } = await supabase.from('receivables').insert(recRows)
  if (e6) console.error('   ❌', e6.message)
  else console.log(`   ✅ ${recRows.length} lançamentos`)

  console.log('\n✅ SEED COMPLETO!')
  console.log('─────────────────────────────────')
  console.log('📧 Email:  nelson@financeflow.app')
  console.log('🔑 Senha:  Nelson@2026')
  console.log(`💸 Gastos fixos Pix:   R$ ${GASTOS_FIXOS_PIX.reduce((s,e)=>s+e.amount,0).toFixed(2)}`)
  console.log(`💳 Gastos fixos Cartão: R$ ${GASTOS_FIXOS_CARTAO.reduce((s,e)=>s+e.amount,0).toFixed(2)}`)
  console.log(`🔄 Variáveis:           R$ ${GASTOS_VARIAVEIS.reduce((s,e)=>s+e.amount,0).toFixed(2)}`)
  console.log(`💰 Receitas:            R$ ${RECEITAS.reduce((s,r)=>s+r.amount,0).toFixed(2)}`)
  console.log(`📈 Investimentos:       R$ ${INVESTIMENTOS.reduce((s,i)=>s+i.amount,0).toFixed(2)}`)
  console.log(`🤝 A Receber:           R$ ${A_RECEBER.reduce((s,r)=>s+r.amount,0).toFixed(2)}`)
  console.log('─────────────────────────────────')
  console.log('Acesse: http://localhost:5173')
  process.exit(0)
}

seed().catch(err => { console.error('Erro fatal:', err); process.exit(1) })
