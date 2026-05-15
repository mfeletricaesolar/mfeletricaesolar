import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './supabase'
import './style.css'

const PAINEIS = ['SOLARMAN', 'SOLIS', 'GOODWE', 'RENAC', 'ELEKEEPER', 'AUXSOL']
const STATUS_ALERTA = ['Pendente', 'Em análise', 'Acompanhar', 'Resolvido']
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente']

function App() {
  const [aba, setAba] = useState('dashboard')
  const [alertas, setAlertas] = useState([])
  const [clientes, setClientes] = useState([])
  const [agenda, setAgenda] = useState([])
  const [relatorios, setRelatorios] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')

  const [novoAlerta, setNovoAlerta] = useState({ cliente: '', painel: 'SOLARMAN', situacao: '', prioridade: 'Média', status: 'Pendente', responsavel: '', observacao: '' })
  const [novoCliente, setNovoCliente] = useState({ nome: '', contato: '', cidade: '', painel: 'SOLARMAN', potencia: '', status: 'Normal' })
  const [novoServico, setNovoServico] = useState({ data: '', horario: '', local: '', servico: '', equipe: '', status: 'Agendado' })
  const [novoRelatorio, setNovoRelatorio] = useState({ dia: '', cliente: '', atividade: '', resultado: '', responsavel: '', status: 'Bem-sucedido' })

  async function carregarTudo() {
    setCarregando(true)
    const [a, c, ag, r] = await Promise.all([
      supabase.from('alertas').select('*').order('created_at', { ascending: false }),
      supabase.from('clientes').select('*').order('created_at', { ascending: false }),
      supabase.from('agenda').select('*').order('data', { ascending: true }),
      supabase.from('relatorios').select('*').order('created_at', { ascending: false }),
    ])

    if (a.error || c.error || ag.error || r.error) {
      setMensagem('Erro ao carregar dados. Confira se as tabelas foram criadas no Supabase.')
    } else {
      setAlertas(a.data || [])
      setClientes(c.data || [])
      setAgenda(ag.data || [])
      setRelatorios(r.data || [])
      setMensagem('')
    }
    setCarregando(false)
  }

  useEffect(() => { carregarTudo() }, [])

  async function salvar(tabela, dados, limpar) {
    const { error } = await supabase.from(tabela).insert([dados])
    if (error) return setMensagem('Erro ao salvar: ' + error.message)
    limpar()
    setMensagem('Salvo com sucesso!')
    carregarTudo()
  }

  async function excluir(tabela, id) {
    if (!confirm('Deseja excluir este registro?')) return
    const { error } = await supabase.from(tabela).delete().eq('id', id)
    if (error) return setMensagem('Erro ao excluir: ' + error.message)
    setMensagem('Registro excluído.')
    carregarTudo()
  }

  async function atualizarStatusAlerta(id, status) {
    const { error } = await supabase.from('alertas').update({ status }).eq('id', id)
    if (error) return setMensagem('Erro ao atualizar: ' + error.message)
    setMensagem('Status atualizado!')
    carregarTudo()
  }

  const alertasFiltrados = useMemo(() => alertas.filter(a =>
    `${a.cliente} ${a.painel} ${a.situacao} ${a.status}`.toLowerCase().includes(busca.toLowerCase())
  ), [alertas, busca])

  const pendentes = alertas.filter(a => a.status !== 'Resolvido').length
  const resolvidos = alertas.filter(a => a.status === 'Resolvido').length

  return (
    <div className="app">
      <header className="topo">
        <div className="topo-info">
          <img src="/logo.jpg" className="logo" alt="MF Elétrica Solar" />
          <div>
            <h1>MF Elétrica Solar</h1>
            <p>Sistema profissional com banco de dados online</p>
          </div>
        </div>
        <button onClick={carregarTudo}>Atualizar</button>
      </header>

      {mensagem && <div className="mensagem">{mensagem}</div>}

      <nav className="menu">
        {['dashboard', 'alertas', 'clientes', 'agenda', 'relatorios'].map(item => (
          <button key={item} className={aba === item ? 'ativo' : ''} onClick={() => setAba(item)}>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      {carregando && <div className="card">Carregando dados...</div>}

      {aba === 'dashboard' && <>
        <section className="grid4">
          <Card titulo="Alertas pendentes" valor={pendentes} />
          <Card titulo="Alertas resolvidos" valor={resolvidos} />
          <Card titulo="Clientes cadastrados" valor={clientes.length} />
          <Card titulo="Serviços na agenda" valor={agenda.length} />
        </section>
        <section className="card"><h2>Painéis monitorados</h2><div className="tags">{PAINEIS.map(p => <span key={p}>{p}</span>)}</div></section>
      </>}

      {aba === 'alertas' && <section className="layout">
        <form className="card form" onSubmit={e => { e.preventDefault(); salvar('alertas', novoAlerta, () => setNovoAlerta({ cliente: '', painel: 'SOLARMAN', situacao: '', prioridade: 'Média', status: 'Pendente', responsavel: '', observacao: '' })) }}>
          <h2>Novo alerta</h2>
          <input required placeholder="Nome do cliente" value={novoAlerta.cliente} onChange={e => setNovoAlerta({...novoAlerta, cliente: e.target.value})} />
          <select value={novoAlerta.painel} onChange={e => setNovoAlerta({...novoAlerta, painel: e.target.value})}>{PAINEIS.map(p => <option key={p}>{p}</option>)}</select>
          <textarea required placeholder="Situação do alerta" value={novoAlerta.situacao} onChange={e => setNovoAlerta({...novoAlerta, situacao: e.target.value})} />
          <select value={novoAlerta.prioridade} onChange={e => setNovoAlerta({...novoAlerta, prioridade: e.target.value})}>{PRIORIDADES.map(p => <option key={p}>{p}</option>)}</select>
          <select value={novoAlerta.status} onChange={e => setNovoAlerta({...novoAlerta, status: e.target.value})}>{STATUS_ALERTA.map(s => <option key={s}>{s}</option>)}</select>
          <input placeholder="Responsável" value={novoAlerta.responsavel} onChange={e => setNovoAlerta({...novoAlerta, responsavel: e.target.value})} />
          <textarea placeholder="Observação" value={novoAlerta.observacao} onChange={e => setNovoAlerta({...novoAlerta, observacao: e.target.value})} />
          <button>Salvar alerta</button>
        </form>

        <div className="card">
          <div className="linha-topo"><h2>Alertas</h2><input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
          <div className="lista">{alertasFiltrados.map(a => <div className="item" key={a.id}>
            <strong>{a.cliente}</strong><p>{a.situacao}</p><small>{a.painel} • {a.prioridade} • {a.responsavel}</small>
            <div className="acoes"><select value={a.status} onChange={e => atualizarStatusAlerta(a.id, e.target.value)}>{STATUS_ALERTA.map(s => <option key={s}>{s}</option>)}</select><button className="perigo" onClick={() => excluir('alertas', a.id)}>Excluir</button></div>
          </div>)}</div>
        </div>
      </section>}

      {aba === 'clientes' && <section className="layout">
        <form className="card form" onSubmit={e => { e.preventDefault(); salvar('clientes', novoCliente, () => setNovoCliente({ nome: '', contato: '', cidade: '', painel: 'SOLARMAN', potencia: '', status: 'Normal' })) }}>
          <h2>Novo cliente</h2>
          <input required placeholder="Nome" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} />
          <input placeholder="Contato" value={novoCliente.contato} onChange={e => setNovoCliente({...novoCliente, contato: e.target.value})} />
          <input placeholder="Cidade/Bairro" value={novoCliente.cidade} onChange={e => setNovoCliente({...novoCliente, cidade: e.target.value})} />
          <select value={novoCliente.painel} onChange={e => setNovoCliente({...novoCliente, painel: e.target.value})}>{PAINEIS.map(p => <option key={p}>{p}</option>)}</select>
          <input placeholder="Potência ex: 8,8 kWp" value={novoCliente.potencia} onChange={e => setNovoCliente({...novoCliente, potencia: e.target.value})} />
          <input placeholder="Status" value={novoCliente.status} onChange={e => setNovoCliente({...novoCliente, status: e.target.value})} />
          <button>Cadastrar cliente</button>
        </form>
        <Lista titulo="Clientes" itens={clientes} render={(c) => <><strong>{c.nome}</strong><p>{c.cidade} • {c.contato}</p><small>{c.painel} • {c.potencia} • {c.status}</small><div className="acoes"><button className="perigo" onClick={() => excluir('clientes', c.id)}>Excluir</button></div></>} />
      </section>}

      {aba === 'agenda' && <section className="layout">
        <form className="card form" onSubmit={e => { e.preventDefault(); salvar('agenda', novoServico, () => setNovoServico({ data: '', horario: '', local: '', servico: '', equipe: '', status: 'Agendado' })) }}>
          <h2>Novo serviço</h2>
          <input type="date" required value={novoServico.data} onChange={e => setNovoServico({...novoServico, data: e.target.value})} />
          <input type="time" value={novoServico.horario} onChange={e => setNovoServico({...novoServico, horario: e.target.value})} />
          <input required placeholder="Local/cliente" value={novoServico.local} onChange={e => setNovoServico({...novoServico, local: e.target.value})} />
          <textarea required placeholder="Serviço a fazer" value={novoServico.servico} onChange={e => setNovoServico({...novoServico, servico: e.target.value})} />
          <input placeholder="Equipe/responsável" value={novoServico.equipe} onChange={e => setNovoServico({...novoServico, equipe: e.target.value})} />
          <input placeholder="Status" value={novoServico.status} onChange={e => setNovoServico({...novoServico, status: e.target.value})} />
          <button>Agendar serviço</button>
        </form>
        <Lista titulo="Agenda" itens={agenda} render={(s) => <><strong>{s.local}</strong><p>{s.servico}</p><small>{s.data} {s.horario} • {s.equipe} • {s.status}</small><div className="acoes"><button className="perigo" onClick={() => excluir('agenda', s.id)}>Excluir</button></div></>} />
      </section>}

      {aba === 'relatorios' && <section className="layout">
        <form className="card form" onSubmit={e => { e.preventDefault(); salvar('relatorios', novoRelatorio, () => setNovoRelatorio({ dia: '', cliente: '', atividade: '', resultado: '', responsavel: '', status: 'Bem-sucedido' })) }}>
          <h2>Novo relatório</h2>
          <input type="date" required value={novoRelatorio.dia} onChange={e => setNovoRelatorio({...novoRelatorio, dia: e.target.value})} />
          <input required placeholder="Cliente" value={novoRelatorio.cliente} onChange={e => setNovoRelatorio({...novoRelatorio, cliente: e.target.value})} />
          <textarea required placeholder="Atividade realizada" value={novoRelatorio.atividade} onChange={e => setNovoRelatorio({...novoRelatorio, atividade: e.target.value})} />
          <textarea required placeholder="Resultado" value={novoRelatorio.resultado} onChange={e => setNovoRelatorio({...novoRelatorio, resultado: e.target.value})} />
          <input placeholder="Responsável" value={novoRelatorio.responsavel} onChange={e => setNovoRelatorio({...novoRelatorio, responsavel: e.target.value})} />
          <input placeholder="Status" value={novoRelatorio.status} onChange={e => setNovoRelatorio({...novoRelatorio, status: e.target.value})} />
          <button>Salvar relatório</button>
        </form>
        <Lista titulo="Relatórios" itens={relatorios} render={(r) => <><strong>{r.cliente}</strong><p>{r.atividade}</p><small>{r.dia} • {r.responsavel} • {r.status}</small><p className="resultado">{r.resultado}</p><div className="acoes"><button className="perigo" onClick={() => excluir('relatorios', r.id)}>Excluir</button></div></>} />
      </section>}
    </div>
  )
}

function Card({ titulo, valor }) {
  return <div className="card resumo"><p>{titulo}</p><h2>{valor}</h2></div>
}

function Lista({ titulo, itens, render }) {
  return <div className="card"><h2>{titulo}</h2><div className="lista">{itens.map(item => <div className="item" key={item.id}>{render(item)}</div>)}</div></div>
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
