import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase } from './supabase';
import './style.css';

const PAINEIS = ['SOLARMAN', 'SOLIS', 'GOODWE', 'RENAC', 'ELEKEEPER', 'AUXSOL'];
const STATUS = ['Pendente', 'Em análise', 'Acompanhar', 'Resolvido'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

function App() {
  const [aba, setAba] = useState('dashboard');
  const [alertas, setAlertas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [busca, setBusca] = useState('');
  const [msg, setMsg] = useState('');
  const [load, setLoad] = useState(false);

  const [alerta, setAlerta] = useState({cliente:'', painel:'SOLARMAN', situacao:'', prioridade:'Média', status:'Pendente', responsavel:'', observacao:''});
  const [cliente, setCliente] = useState({nome:'', contato:'', cidade:'', painel:'SOLARMAN', potencia:'', status:'Normal'});
  const [servico, setServico] = useState({data:'', horario:'', local:'', servico:'', equipe:'', status:'Agendado'});
  const [relatorio, setRelatorio] = useState({dia:'', cliente:'', atividade:'', resultado:'', responsavel:'', status:'Bem-sucedido'});

  async function carregar() {
    setLoad(true);
    const [a,c,g,r] = await Promise.all([
      supabase.from('alertas').select('*').order('created_at', {ascending:false}),
      supabase.from('clientes').select('*').order('created_at', {ascending:false}),
      supabase.from('agenda').select('*').order('data', {ascending:true}),
      supabase.from('relatorios').select('*').order('created_at', {ascending:false}),
    ]);
    if (a.error || c.error || g.error || r.error) setMsg('Erro ao conectar no Supabase. Confira as variáveis na Vercel.');
    else {
      setAlertas(a.data || []); setClientes(c.data || []); setAgenda(g.data || []); setRelatorios(r.data || []); setMsg('');
    }
    setLoad(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(tabela, dados, limpar) {
    const { error } = await supabase.from(tabela).insert([dados]);
    if (error) return setMsg('Erro ao salvar: ' + error.message);
    limpar();
    setMsg('Salvo com sucesso.');
    carregar();
  }

  async function remover(tabela, id) {
    if (!confirm('Deseja excluir?')) return;
    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) return setMsg('Erro ao excluir: ' + error.message);
    carregar();
  }

  async function mudarStatus(id, status) {
    await supabase.from('alertas').update({status}).eq('id', id);
    carregar();
  }

  const filtrados = useMemo(() => alertas.filter(a => `${a.cliente} ${a.painel} ${a.situacao}`.toLowerCase().includes(busca.toLowerCase())), [alertas,busca]);
  const pend = alertas.filter(a => a.status !== 'Resolvido').length;
  const res = alertas.filter(a => a.status === 'Resolvido').length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="MF Elétrica e Solar"/>
          <div><b>MF Elétrica e Solar</b><span>Gestão Técnica</span></div>
        </div>
        <Menu aba={aba} setAba={setAba}/>
        <div className="db">🟡 <div><b>Banco online</b><span>Supabase conectado</span></div></div>
      </aside>

      <main className="main">
        <section className="hero">
          <div><small>⚡ Sistema operacional premium</small><h1>MF Elétrica e Solar</h1><p>Controle de alertas, clientes, agenda técnica e relatórios com banco de dados online.</p></div>
          <button onClick={carregar}>↻ Atualizar</button>
        </section>

        {msg && <div className="msg">{msg}</div>}
        {load && <div className="msg">Carregando...</div>}

        {aba === 'dashboard' && <>
          <section className="metrics">
            <Card t="Alertas pendentes" v={pend} d="Precisam de acompanhamento"/>
            <Card t="Alertas resolvidos" v={res} d="Ocorrências finalizadas"/>
            <Card t="Clientes cadastrados" v={clientes.length} d="Base ativa no sistema"/>
            <Card t="Serviços na agenda" v={agenda.length} d="Visitas e tarefas"/>
          </section>
          <section className="grid">
            <div className="panel big">
              <div className="head"><div><h2>Ocorrências recentes</h2><p>Últimos alertas registrados no sistema.</p></div><button onClick={()=>setAba('alertas')}>+ Novo alerta</button></div>
              <ListaVazia ok={alertas.length === 0} texto="Nenhum alerta registrado ainda."/>
              {alertas.slice(0,5).map(a => <Item key={a.id} title={a.cliente} text={a.situacao} sub={`${a.painel} • ${a.status}`}/>)}
            </div>
            <div className="panel"><h2>Painéis monitorados</h2><div className="chips">{PAINEIS.map(p => <span key={p}>{p}</span>)}</div></div>
          </section>
        </>}

        {aba === 'alertas' && <Area>
          <Form title="Novo alerta" onSubmit={(e)=>{e.preventDefault(); salvar('alertas', alerta, ()=>setAlerta({cliente:'', painel:'SOLARMAN', situacao:'', prioridade:'Média', status:'Pendente', responsavel:'', observacao:''}))}}>
            <Campo label="Cliente" value={alerta.cliente} onChange={v=>setAlerta({...alerta, cliente:v})} required/>
            <Select label="Painel" value={alerta.painel} options={PAINEIS} onChange={v=>setAlerta({...alerta, painel:v})}/>
            <Texto label="Situação" value={alerta.situacao} onChange={v=>setAlerta({...alerta, situacao:v})} required/>
            <Select label="Prioridade" value={alerta.prioridade} options={PRIORIDADES} onChange={v=>setAlerta({...alerta, prioridade:v})}/>
            <Select label="Status" value={alerta.status} options={STATUS} onChange={v=>setAlerta({...alerta, status:v})}/>
            <Campo label="Responsável" value={alerta.responsavel} onChange={v=>setAlerta({...alerta, responsavel:v})}/>
            <Texto label="Observação" value={alerta.observacao} onChange={v=>setAlerta({...alerta, observacao:v})}/>
          </Form>
          <div className="panel">
            <div className="head"><div><h2>Alertas registrados</h2><p>Pesquise e atualize o status.</p></div><input placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
            {filtrados.map(a => <div className="item" key={a.id}><div><b>{a.cliente}</b><p>{a.situacao}</p><small>{a.painel} • {a.prioridade} • {a.responsavel}</small></div><div className="actions"><select value={a.status} onChange={e=>mudarStatus(a.id,e.target.value)}>{STATUS.map(s=><option key={s}>{s}</option>)}</select><button className="danger" onClick={()=>remover('alertas',a.id)}>Excluir</button></div></div>)}
            <ListaVazia ok={filtrados.length === 0} texto="Nenhum alerta encontrado."/>
          </div>
        </Area>}

        {aba === 'clientes' && <Area>
          <Form title="Novo cliente" onSubmit={(e)=>{e.preventDefault(); salvar('clientes', cliente, ()=>setCliente({nome:'', contato:'', cidade:'', painel:'SOLARMAN', potencia:'', status:'Normal'}))}}>
            <Campo label="Nome" value={cliente.nome} onChange={v=>setCliente({...cliente,nome:v})} required/>
            <Campo label="Contato" value={cliente.contato} onChange={v=>setCliente({...cliente,contato:v})}/>
            <Campo label="Cidade/Bairro" value={cliente.cidade} onChange={v=>setCliente({...cliente,cidade:v})}/>
            <Select label="Painel" value={cliente.painel} options={PAINEIS} onChange={v=>setCliente({...cliente,painel:v})}/>
            <Campo label="Potência" value={cliente.potencia} onChange={v=>setCliente({...cliente,potencia:v})}/>
            <Campo label="Status" value={cliente.status} onChange={v=>setCliente({...cliente,status:v})}/>
          </Form>
          <PainelLista title="Clientes" items={clientes} empty="Nenhum cliente cadastrado.">{c=><Item key={c.id} title={c.nome} text={`${c.cidade || ''} ${c.contato || ''}`} sub={`${c.painel} • ${c.potencia || 'Sem potência'} • ${c.status}`} onDelete={()=>remover('clientes',c.id)}/>}</PainelLista>
        </Area>}

        {aba === 'agenda' && <Area>
          <Form title="Novo serviço" onSubmit={(e)=>{e.preventDefault(); salvar('agenda', servico, ()=>setServico({data:'', horario:'', local:'', servico:'', equipe:'', status:'Agendado'}))}}>
            <Campo label="Data" type="date" value={servico.data} onChange={v=>setServico({...servico,data:v})} required/>
            <Campo label="Horário" type="time" value={servico.horario} onChange={v=>setServico({...servico,horario:v})}/>
            <Campo label="Local/Cliente" value={servico.local} onChange={v=>setServico({...servico,local:v})} required/>
            <Texto label="Serviço a fazer" value={servico.servico} onChange={v=>setServico({...servico,servico:v})} required/>
            <Campo label="Equipe/Responsável" value={servico.equipe} onChange={v=>setServico({...servico,equipe:v})}/>
            <Campo label="Status" value={servico.status} onChange={v=>setServico({...servico,status:v})}/>
          </Form>
          <PainelLista title="Agenda" items={agenda} empty="Nenhum serviço agendado.">{s=><Item key={s.id} title={s.local} text={s.servico} sub={`${s.data} ${s.horario || ''} • ${s.equipe || ''} • ${s.status}`} onDelete={()=>remover('agenda',s.id)}/>}</PainelLista>
        </Area>}

        {aba === 'relatorios' && <Area>
          <Form title="Novo relatório" onSubmit={(e)=>{e.preventDefault(); salvar('relatorios', relatorio, ()=>setRelatorio({dia:'', cliente:'', atividade:'', resultado:'', responsavel:'', status:'Bem-sucedido'}))}}>
            <Campo label="Dia" type="date" value={relatorio.dia} onChange={v=>setRelatorio({...relatorio,dia:v})} required/>
            <Campo label="Cliente" value={relatorio.cliente} onChange={v=>setRelatorio({...relatorio,cliente:v})} required/>
            <Texto label="Atividade realizada" value={relatorio.atividade} onChange={v=>setRelatorio({...relatorio,atividade:v})} required/>
            <Texto label="Resultado" value={relatorio.resultado} onChange={v=>setRelatorio({...relatorio,resultado:v})} required/>
            <Campo label="Responsável" value={relatorio.responsavel} onChange={v=>setRelatorio({...relatorio,responsavel:v})}/>
            <Campo label="Status" value={relatorio.status} onChange={v=>setRelatorio({...relatorio,status:v})}/>
          </Form>
          <PainelLista title="Relatórios" items={relatorios} empty="Nenhum relatório registrado.">{r=><Item key={r.id} title={r.cliente} text={r.atividade} sub={`${r.dia} • ${r.responsavel || ''} • ${r.status}`} onDelete={()=>remover('relatorios',r.id)}/>}</PainelLista>
        </Area>}
      </main>
    </div>
  );
}

function Menu({aba,setAba}) {
  const items = [['dashboard','Dashboard'],['alertas','Alertas'],['clientes','Clientes'],['agenda','Agenda'],['relatorios','Relatórios']];
  return <nav className="menu">{items.map(([id,n])=><button key={id} className={aba===id?'active':''} onClick={()=>setAba(id)}>{n}</button>)}</nav>
}

function Card({t,v,d}) { return <div className="card"><p>{t}</p><h2>{v}</h2><span>{d}</span></div> }
function Area({children}) { return <section className="area">{children}</section> }
function Form({title,onSubmit,children}) { return <form className="form panel" onSubmit={onSubmit}><h2>{title}</h2>{children}<button className="submit">Salvar</button></form> }
function Campo({label,value,onChange,type='text',required=false}) { return <label><span>{label}</span><input type={type} required={required} value={value} onChange={e=>onChange(e.target.value)}/></label> }
function Texto({label,value,onChange,required=false}) { return <label><span>{label}</span><textarea required={required} value={value} onChange={e=>onChange(e.target.value)}/></label> }
function Select({label,value,options,onChange}) { return <label><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label> }
function Item({title,text,sub,onDelete}) { return <div className="item"><div><b>{title}</b><p>{text}</p><small>{sub}</small></div>{onDelete && <button className="danger" onClick={onDelete}>Excluir</button>}</div> }
function PainelLista({title,items,empty,children}) { return <div className="panel"><h2>{title}</h2>{items.map(children)}<ListaVazia ok={items.length===0} texto={empty}/></div> }
function ListaVazia({ok,texto}) { return ok ? <div className="empty">{texto}</div> : null }

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
