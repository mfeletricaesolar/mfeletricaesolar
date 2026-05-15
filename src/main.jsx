import logo from "../logo.png";
import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Database, FileText, Gauge, Home, Plus, RefreshCw, Search, Trash2, Users, Zap } from 'lucide-react'
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
    if (a.error || c.error || ag.error || r.error) setMensagem('Erro ao carregar dados. Confira as tabelas e variáveis do Supabase.')
    else {
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
    if (!window.confirm('Deseja excluir este registro?')) return
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

  const alertasFiltrados = useMemo(() => alertas.filter((item) =>
    `${item.cliente} ${item.painel} ${item.situacao} ${item.status} ${item.responsavel}`.toLowerCase().includes(busca.toLowerCase())
  ), [alertas, busca])

  const pendentes = alertas.filter((a) => a.status !== 'Resolvido').length
  const resolvidos = alertas.filter((a) => a.status === 'Resolvido').length
  const menu = [
    { id: 'dashboard', nome: 'Dashboard', icon: Home },
    { id: 'alertas', nome: 'Alertas', icon: AlertTriangle },
    { id: 'clientes', nome: 'Clientes', icon: Users },
    { id: 'agenda', nome: 'Agenda', icon: CalendarDays },
    { id: 'relatorios', nome: 'Relatórios', icon: FileText },
  ]

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="MF Elétrica Solar" />
          <div><strong>MF Solar</strong><span>Gestão Técnica</span></div>
        </div>
        <nav className="sideMenu">
          {menu.map((item) => {
            const Icon = item.icon
            return <button key={item.id} className={aba === item.id ? 'active' : ''} onClick={() => setAba(item.id)}><Icon size={19} />{item.nome}</button>
          })}
        </nav>
        <div className="sideFooter"><Database size={18} /><div><strong>Banco online</strong><span>Supabase conectado</span></div></div>
      </aside>

      <main className="main">
        <header className="hero">
          <div><span className="eyebrow"><Zap size={16} /> Sistema operacional premium</span><h1>MF Elétrica Solar</h1><p>Controle de alertas, clientes, agenda técnica e relatórios com banco de dados online.</p></div>
          <button className="refresh" onClick={carregarTudo}><RefreshCw size={18} />Atualizar</button>
        </header>

        {mensagem && <div className="message">{mensagem}</div>}
        {carregando && <div className="loading">Carregando informações...</div>}

        {aba === 'dashboard' && <>
          <section className="metrics">
            <Metric icon={AlertTriangle} title="Alertas pendentes" value={pendentes} detail="Precisam de acompanhamento" />
            <Metric icon={CheckCircle2} title="Alertas resolvidos" value={resolvidos} detail="Ocorrências finalizadas" />
            <Metric icon={Users} title="Clientes cadastrados" value={clientes.length} detail="Base ativa no sistema" />
            <Metric icon={CalendarDays} title="Serviços na agenda" value={agenda.length} detail="Visitas e tarefas" />
          </section>
          <section className="dashboardGrid">
            <div className="panel wide">
              <div className="panelHeader"><div><h2>Ocorrências recentes</h2><p>Últimos alertas registrados no sistema.</p></div><button onClick={() => setAba('alertas')}><Plus size={16} />Novo alerta</button></div>
              <div className="list compact">{alertas.slice(0, 5).map((alerta) => <div className="listItem" key={alerta.id}><div><strong>{alerta.cliente}</strong><p>{alerta.situacao}</p><small>{alerta.painel} • {alerta.responsavel || 'Sem responsável'}</small></div><Badge>{alerta.status}</Badge></div>)}{alertas.length === 0 && <Empty text="Nenhum alerta registrado ainda." />}</div>
            </div>
            <div className="panel"><h2>Painéis monitorados</h2><div className="chips">{PAINEIS.map((painel) => <span key={painel}><Gauge size={14} /> {painel}</span>)}</div></div>
          </section>
        </>}

        {aba === 'alertas' && <section className="workArea">
          <FormCard title="Novo alerta" icon={AlertTriangle}>
            <form onSubmit={(e) => { e.preventDefault(); salvar('alertas', novoAlerta, () => setNovoAlerta({ cliente: '', painel: 'SOLARMAN', situacao: '', prioridade: 'Média', status: 'Pendente', responsavel: '', observacao: '' })) }}>
              <Input label="Cliente" required value={novoAlerta.cliente} onChange={(v) => setNovoAlerta({ ...novoAlerta, cliente: v })} />
              <Select label="Painel" value={novoAlerta.painel} options={PAINEIS} onChange={(v) => setNovoAlerta({ ...novoAlerta, painel: v })} />
              <Textarea label="Situação" required value={novoAlerta.situacao} onChange={(v) => setNovoAlerta({ ...novoAlerta, situacao: v })} />
              <Select label="Prioridade" value={novoAlerta.prioridade} options={PRIORIDADES} onChange={(v) => setNovoAlerta({ ...novoAlerta, prioridade: v })} />
              <Select label="Status" value={novoAlerta.status} options={STATUS_ALERTA} onChange={(v) => setNovoAlerta({ ...novoAlerta, status: v })} />
              <Input label="Responsável" value={novoAlerta.responsavel} onChange={(v) => setNovoAlerta({ ...novoAlerta, responsavel: v })} />
              <Textarea label="Observação" value={novoAlerta.observacao} onChange={(v) => setNovoAlerta({ ...novoAlerta, observacao: v })} />
              <button className="submit">Salvar alerta</button>
            </form>
          </FormCard>
          <div className="panel">
            <div className="panelHeader"><div><h2>Alertas registrados</h2><p>Pesquise, acompanhe e atualize o status.</p></div><div className="search"><Search size={18} /><input placeholder="Buscar alerta..." value={busca} onChange={(e) => setBusca(e.target.value)} /></div></div>
            <div className="list">{alertasFiltrados.map((alerta) => <div className="listItem detailed" key={alerta.id}><div><strong>{alerta.cliente}</strong><p>{alerta.situacao}</p><small>{alerta.painel} • {alerta.prioridade} • {alerta.responsavel || 'Sem responsável'}</small>{alerta.observacao && <em>{alerta.observacao}</em>}</div><div className="actions"><select value={alerta.status} onChange={(e) => atualizarStatusAlerta(alerta.id, e.target.value)}>{STATUS_ALERTA.map((s) => <option key={s}>{s}</option>)}</select><button className="delete" onClick={() => excluir('alertas', alerta.id)}><Trash2 size={16} /></button></div></div>)}{alertasFiltrados.length === 0 && <Empty text="Nenhum alerta encontrado." />}</div>
          </div>
        </section>}

        {aba === 'clientes' && <section className="workArea">
          <FormCard title="Novo cliente" icon={Users}>
            <form onSubmit={(e) => { e.preventDefault(); salvar('clientes', novoCliente, () => setNovoCliente({ nome: '', contato: '', cidade: '', painel: 'SOLARMAN', potencia: '', status: 'Normal' })) }}>
              <Input label="Nome" required value={novoCliente.nome} onChange={(v) => setNovoCliente({ ...novoCliente, nome: v })} /><Input label="Contato" value={novoCliente.contato} onChange={(v) => setNovoCliente({ ...novoCliente, contato: v })} /><Input label="Cidade/Bairro" value={novoCliente.cidade} onChange={(v) => setNovoCliente({ ...novoCliente, cidade: v })} /><Select label="Painel" value={novoCliente.painel} options={PAINEIS} onChange={(v) => setNovoCliente({ ...novoCliente, painel: v })} /><Input label="Potência" placeholder="Ex: 8,8 kWp" value={novoCliente.potencia} onChange={(v) => setNovoCliente({ ...novoCliente, potencia: v })} /><Input label="Status" value={novoCliente.status} onChange={(v) => setNovoCliente({ ...novoCliente, status: v })} /><button className="submit">Cadastrar cliente</button>
            </form>
          </FormCard>
          <ListPanel title="Clientes cadastrados" subtitle="Base de clientes monitorados." items={clientes} empty="Nenhum cliente cadastrado.">{(cliente) => <div className="listItem detailed" key={cliente.id}><div><strong>{cliente.nome}</strong><p>{cliente.cidade || 'Sem localização'} • {cliente.contato || 'Sem contato'}</p><small>{cliente.painel} • {cliente.potencia || 'Sem potência'} • {cliente.status}</small></div><button className="delete" onClick={() => excluir('clientes', cliente.id)}><Trash2 size={16} /></button></div>}</ListPanel>
        </section>}

        {aba === 'agenda' && <section className="workArea">
          <FormCard title="Novo serviço" icon={CalendarDays}>
            <form onSubmit={(e) => { e.preventDefault(); salvar('agenda', novoServico, () => setNovoServico({ data: '', horario: '', local: '', servico: '', equipe: '', status: 'Agendado' })) }}>
              <Input label="Data" type="date" required value={novoServico.data} onChange={(v) => setNovoServico({ ...novoServico, data: v })} /><Input label="Horário" type="time" value={novoServico.horario} onChange={(v) => setNovoServico({ ...novoServico, horario: v })} /><Input label="Local/Cliente" required value={novoServico.local} onChange={(v) => setNovoServico({ ...novoServico, local: v })} /><Textarea label="Serviço a fazer" required value={novoServico.servico} onChange={(v) => setNovoServico({ ...novoServico, servico: v })} /><Input label="Equipe/Responsável" value={novoServico.equipe} onChange={(v) => setNovoServico({ ...novoServico, equipe: v })} /><Input label="Status" value={novoServico.status} onChange={(v) => setNovoServico({ ...novoServico, status: v })} /><button className="submit">Agendar serviço</button>
            </form>
          </FormCard>
          <ListPanel title="Agenda técnica" subtitle="Serviços e visitas programadas." items={agenda} empty="Nenhum serviço agendado.">{(servico) => <div className="listItem detailed" key={servico.id}><div><strong>{servico.local}</strong><p>{servico.servico}</p><small>{servico.data} {servico.horario || ''} • {servico.equipe || 'Sem equipe'} • {servico.status}</small></div><button className="delete" onClick={() => excluir('agenda', servico.id)}><Trash2 size={16} /></button></div>}</ListPanel>
        </section>}

        {aba === 'relatorios' && <section className="workArea">
          <FormCard title="Novo relatório" icon={ClipboardList}>
            <form onSubmit={(e) => { e.preventDefault(); salvar('relatorios', novoRelatorio, () => setNovoRelatorio({ dia: '', cliente: '', atividade: '', resultado: '', responsavel: '', status: 'Bem-sucedido' })) }}>
              <Input label="Dia" type="date" required value={novoRelatorio.dia} onChange={(v) => setNovoRelatorio({ ...novoRelatorio, dia: v })} /><Input label="Cliente" required value={novoRelatorio.cliente} onChange={(v) => setNovoRelatorio({ ...novoRelatorio, cliente: v })} /><Textarea label="Atividade realizada" required value={novoRelatorio.atividade} onChange={(v) => setNovoRelatorio({ ...novoRelatorio, atividade: v })} /><Textarea label="Resultado" required value={novoRelatorio.resultado} onChange={(v) => setNovoRelatorio({ ...novoRelatorio, resultado: v })} /><Input label="Responsável" value={novoRelatorio.responsavel} onChange={(v) => setNovoRelatorio({ ...novoRelatorio, responsavel: v })} /><Input label="Status" value={novoRelatorio.status} onChange={(v) => setNovoRelatorio({ ...novoRelatorio, status: v })} /><button className="submit">Salvar relatório</button>
            </form>
          </FormCard>
          <ListPanel title="Relatórios" subtitle="Histórico das atividades concluídas." items={relatorios} empty="Nenhum relatório registrado.">{(relatorio) => <div className="listItem detailed" key={relatorio.id}><div><strong>{relatorio.cliente}</strong><p>{relatorio.atividade}</p><small>{relatorio.dia} • {relatorio.responsavel || 'Sem responsável'} • {relatorio.status}</small><em>{relatorio.resultado}</em></div><button className="delete" onClick={() => excluir('relatorios', relatorio.id)}><Trash2 size={16} /></button></div>}</ListPanel>
        </section>}
      </main>
    </div>
  )
}

function Metric({ icon: Icon, title, value, detail }) { return <div className="metric"><div className="metricIcon"><Icon size={22} /></div><p>{title}</p><h2>{value}</h2><span>{detail}</span></div> }
function Badge({ children }) { return <span className={`badge ${String(children).toLowerCase().replaceAll(' ', '-')}`}>{children}</span> }
function Empty({ text }) { return <div className="empty">{text}</div> }
function FormCard({ title, icon: Icon, children }) { return <div className="formCard"><div className="formTitle"><Icon size={20} /><h2>{title}</h2></div>{children}</div> }
function ListPanel({ title, subtitle, items, empty, children }) { return <div className="panel"><div className="panelHeader"><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="list">{items.map(children)}{items.length === 0 && <Empty text={empty} />}</div></div> }
function Input({ label, value, onChange, type = 'text', placeholder = '', required = false }) { return <label className="field"><span>{label}</span><input type={type} required={required} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></label> }
function Textarea({ label, value, onChange, required = false }) { return <label className="field"><span>{label}</span><textarea required={required} value={value} onChange={(e) => onChange(e.target.value)} /></label> }
function Select({ label, value, options, onChange }) { return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((opcao) => <option key={opcao}>{opcao}</option>)}</select></label> }

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
