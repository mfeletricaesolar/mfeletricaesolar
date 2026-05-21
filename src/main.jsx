import React,{useEffect,useMemo,useState}from"react";import ReactDOM from"react-dom/client";import{jsPDF}from"jspdf";import QRCode from"qrcode";import{supabase}from"./supabase";import"./style.css";
const PAINEIS=["SOLARMAN","SOLIS","GOODWE","RENAC","ELEKEEPER","AUXSOL"],STATUS=["Pendente","Em análise","Acompanhar","Resolvido"],PRIOR=["Baixa","Média","Alta","Urgente"];
const STATUS_OS=["Agendado","Em andamento","Aguardando cliente","Finalizado"];
const VP={cliente:"",valor_projeto:"",carencia:"3 meses",banco:"",validade:"",primeiro_pagamento:"",observacoes:"",opcoes:[{parcelas:"48",valor:""},{parcelas:"60",valor:""},{parcelas:"72",valor:""}]};
const VA={cliente:"",painel:"SOLARMAN",situacao:"",prioridade:"Média",status:"Pendente",responsavel:"",observacao:"",arquivo_url:""},VC={nome:"",contato:"",cidade:"",painel:"SOLARMAN",potencia:"",status:"Normal"},VG={data:"",horario:"",local:"",servico:"",equipe:"",status:"Agendado",tipo_os:"Manutenção",diagnostico:"",solucao:"",assinatura_nome:"",assinatura_url:"",arquivo_url:""},VR={dia:"",cliente:"",atividade:"",resultado:"",responsavel:"",status:"Bem-sucedido",arquivo_url:""};
function App(){const osPublicoId=new URLSearchParams(window.location.search).get("os");const[osPublica,setOsPublica]=useState(null),[carregandoOs,setCarregandoOs]=useState(false);const[aba,setAba]=useState("dashboard"),[alertas,setAlertas]=useState([]),[clientes,setClientes]=useState([]),[agenda,setAgenda]=useState([]),[relatorios,setRelatorios]=useState([]),[propostas,setPropostas]=useState([]),[busca,setBusca]=useState(""),[msg,setMsg]=useState(""),[arq,setArq]=useState(null),[assinatura,setAssinatura]=useState(""),[edit,setEdit]=useState(null),[alerta,setAlerta]=useState(VA),[cliente,setCliente]=useState(VC),[serv,setServ]=useState(VG),[rel,setRel]=useState(VR),[proposta,setProposta]=useState(VP);
async function carregar(){let[a,c,g,r,p]=await Promise.all([supabase.from("alertas").select("*").order("created_at",{ascending:false}),supabase.from("clientes").select("*").order("created_at",{ascending:false}),supabase.from("agenda").select("*").order("data",{ascending:true}),supabase.from("relatorios").select("*").order("created_at",{ascending:false}),supabase.from("propostas").select("*").order("created_at",{ascending:false})]);if(a.error||c.error||g.error||r.error||p.error)setMsg("Erro ao carregar dados.");else{setAlertas(a.data||[]);setClientes(c.data||[]);setAgenda(g.data||[]);setRelatorios(r.data||[]);setPropostas(p.data||[]);setMsg("")}}
useEffect(()=>{carregar()},[]);
useEffect(()=>{async function abrirOsPublica(){if(!osPublicoId)return;setCarregandoOs(true);let{data,error}=await supabase.from("agenda").select("*").eq("id",osPublicoId).single();if(!error)setOsPublica(data);setCarregandoOs(false)}abrirOsPublica()},[osPublicoId]);
async function atualizarManual(){await carregar();setMsg("Sistema atualizado com sucesso.")}
async function upload(t){if(!arq)return"";let ext=arq.name.split(".").pop(),nome=`${t}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;let{error}=await supabase.storage.from("anexos-mf").upload(nome,arq);if(error){setMsg("Erro no upload: "+error.message);return""}return supabase.storage.from("anexos-mf").getPublicUrl(nome).data.publicUrl}
async function salvar(t,d,limpar){let obj={...d};if(t==="propostas")obj.opcoes=JSON.stringify(d.opcoes||[]);let url=await upload(t);if(url)obj.arquivo_url=url;if(t==="agenda"&&assinatura)obj.assinatura_url=assinatura;let resp=edit?.tabela===t?await supabase.from(t).update(obj).eq("id",edit.id):await supabase.from(t).insert([obj]);if(resp.error)return setMsg("Erro ao salvar: "+resp.error.message);setEdit(null);setArq(null);setAssinatura("");limpar();setMsg(edit?"Alteração salva.":"Salvo com sucesso.");carregar()}
async function del(t,id){if(!confirm("Excluir?"))return;await supabase.from(t).delete().eq("id",id);carregar()}
function editar(t,i){setEdit({tabela:t,id:i.id});setArq(null);setAssinatura(i.assinatura_url||"");if(t==="alertas"){setAlerta({...VA,...i});setAba("alertas")}if(t==="clientes"){setCliente({...VC,...i});setAba("clientes")}if(t==="agenda"){setServ({...VG,...i});setAba("agenda")}if(t==="relatorios"){setRel({...VR,...i});setAba("relatorios")}
if(t==="propostas"){let ops=[];try{ops=typeof i.opcoes==="string"?JSON.parse(i.opcoes):(i.opcoes||[])}catch(e){ops=[]}setProposta({...VP,...i,opcoes:ops.length?ops:VP.opcoes});setAba("propostas")}
scrollTo({top:0,behavior:"smooth"})}
function cancelar(){setEdit(null);setArq(null);setAssinatura("");setAlerta(VA);setCliente(VC);setServ(VG);setRel(VR);setProposta(VP)}
async function stat(id,s){await supabase.from("alertas").update({status:s}).eq("id",id);carregar()}
async function statOS(id,s){await supabase.from("agenda").update({status:s}).eq("id",id);carregar()}
function osNumero(item){return "OS-"+String(item.id||"").slice(0,8).toUpperCase()}
function progressoOS(s){if(s==="Finalizado")return 100;if(s==="Em andamento")return 60;if(s==="Aguardando cliente")return 45;return 20}
async function logoBase64(){try{let r=await fetch("/logo.png"),b=await r.blob();return await new Promise(ok=>{let fr=new FileReader();fr.onload=()=>ok(fr.result);fr.readAsDataURL(b)})}catch(e){return null}}
async function pdf(tipo,x){
let d=new jsPDF("p","mm","a4"),logo=await logoBase64(),yellow=[250,204,21],black=[5,5,5],gray=[230,230,230],y=82;
function txt(t,xp,yp,size=11,bold=false,color=[0,0,0]){d.setTextColor(...color);d.setFont("helvetica",bold?"bold":"normal");d.setFontSize(size);d.text(String(t||"-"),xp,yp)}
function line(yp){d.setDrawColor(...gray);d.setLineWidth(.35);d.line(10,yp,200,yp)}
function pill(t,xp,yp,w=24){d.setFillColor(...yellow);d.roundedRect(xp,yp-5,w,8,2,2,"F");txt(t,xp+4,yp,10,false,[0,0,0])}
function row(label,value,badge=false){txt(label+":",14,y,10,true);if(badge)pill(value||"-",52,y,String(value||"-").length>8?30:24);else txt(value||"-",52,y,10,false);line(y+7);y+=15}
d.setFillColor(...black);d.rect(0,0,210,45,"F");d.setFillColor(...yellow);d.rect(120,40,90,5,"F");d.setFillColor(...yellow);d.roundedRect(112,38,18,8,3,3,"F");
if(logo){try{d.addImage(logo,"PNG",7,8,30,17)}catch(e){}}
txt("MF Elétrica e Solar",45,18,17,true,[255,255,255]);txt("Gestão Técnica",45,29,10,false,yellow);
d.setFillColor(...yellow);d.circle(14,60,4,"F");
txt(tipo.toUpperCase(),24,63,16,true,[0,0,0]);
txt("Gerado em: "+new Date().toLocaleString("pt-BR"),145,62,8,false,[0,0,0]);
d.setDrawColor(...yellow);d.setLineWidth(.5);d.line(10,70,200,70);

if(tipo==="Alerta Técnico"){row("Cliente",x.cliente);row("Painel",x.painel);row("Prioridade",x.prioridade,true);row("Status",x.status,true);row("Responsável",x.responsavel);row("Situação",x.situacao);row("Observação",x.observacao)}
if(tipo==="Tarefa Técnica"){row("OS",osNumero(x));row("Tipo",x.tipo_os);row("Local/Cliente",x.local);row("Data",x.data);row("Horário",x.horario);row("Equipe/Técnico",x.equipe);row("Status",x.status,true);row("Serviço",x.servico);row("Diagnóstico",x.diagnostico);row("Solução",x.solucao)}
if(tipo==="Relatório Técnico"){row("Cliente",x.cliente);row("Dia",x.dia);row("Responsável",x.responsavel);row("Status",x.status,true);row("Atividade",x.atividade);row("Resultado",x.resultado)}
if(x?.arquivo_url){y+=3;txt("Anexo:",14,y,10,true);d.setTextColor(0,91,180);d.textWithLink("Abrir anexo enviado",52,y,{url:x.arquivo_url});d.setTextColor(0,0,0);y+=10}

if(tipo==="Tarefa Técnica"){
  try{
    let link=window.location.origin+"?os="+(x.id||"");
    let qr=await QRCode.toDataURL(link,{margin:1,width:180});
    d.addImage(qr,"PNG",165,78,28,28);
    txt("QR Code da OS",164,111,8,true,[0,0,0]);
  }catch(e){}
  if(x?.assinatura_url){
    const sy=198;
    d.setFillColor(255,255,255);
    d.rect(10,190,190,55,"F");
    d.setDrawColor(...yellow);
    d.roundedRect(14,198,92,40,3,3);
    txt("Assinatura do cliente/responsável",18,207,8,true,[0,0,0]);
    try{d.addImage(x.assinatura_url,"PNG",25,213,58,17)}catch(e){}
    txt(x.assinatura_nome||"Assinatura registrada",20,235,7,false,[0,0,0]);
  }
}

d.setDrawColor(...yellow);d.setLineWidth(.45);d.line(10,250,200,250);
txt("Compromisso com qualidade,",24,263,8,false,[0,0,0]);txt("segurança e eficiência.",24,268,8,false,[0,0,0]);
txt("MF Elétrica e Solar",88,263,10,true,[0,0,0]);txt("Soluções inteligentes em energia",77,269,8,false,[0,0,0]);
txt("Relatório gerado automaticamente",151,263,8,false,[0,0,0]);txt("pelo sistema.",151,268,8,false,[0,0,0]);
d.save(tipo.toLowerCase().replaceAll(" ","-")+"-"+Date.now()+".pdf")
}

function dinheiro(v){let n=String(v||"").replace(/\./g,"").replace(",",".");let num=parseFloat(n);if(isNaN(num))return v||"-";return num.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function opcoesDaProposta(p){try{return typeof p.opcoes==="string"?JSON.parse(p.opcoes):(p.opcoes||[])}catch(e){return[]}}
function setOpcao(i,campo,valor){setProposta(prev=>({...prev,opcoes:prev.opcoes.map((o,idx)=>idx===i?{...o,[campo]:valor}:o)}))}
function addOpcao(){setProposta(prev=>({...prev,opcoes:[...(prev.opcoes||[]),{parcelas:"",valor:""}]}))}
function removeOpcao(i){setProposta(prev=>({...prev,opcoes:prev.opcoes.filter((_,idx)=>idx!==i)}))}
async function pdfProposta(p){
  let d=new jsPDF("p","mm","a4"),logo=await logoBase64(),yellow=[250,204,21],black=[5,5,5],gray=[230,230,230];
  function txt(t,x,y,size=11,bold=false,color=[0,0,0]){d.setTextColor(...color);d.setFont("helvetica",bold?"bold":"normal");d.setFontSize(size);d.text(String(t||"-"),x,y)}
  d.setFillColor(...black);d.rect(0,0,210,45,"F");d.setFillColor(...yellow);d.rect(120,40,90,5,"F");d.setFillColor(...yellow);d.roundedRect(112,38,18,8,3,3,"F");
  if(logo){try{d.addImage(logo,"PNG",7,8,30,17)}catch(e){}}
  txt("MF Elétrica e Solar",45,18,17,true,[255,255,255]);txt("Proposta de Financiamento",45,29,10,false,yellow);
  d.setFillColor(...yellow);d.circle(14,60,4,"F");txt("PROPOSTA COMERCIAL",24,63,16,true,[0,0,0]);txt("Gerado em: "+new Date().toLocaleString("pt-BR"),145,62,8,false,[0,0,0]);
  d.setDrawColor(...yellow);d.setLineWidth(.5);d.line(10,70,200,70);
  let y=85;
  function row(label,value){txt(label+":",14,y,10,true);txt(value||"-",58,y,10,false);d.setDrawColor(...gray);d.line(10,y+7,200,y+7);y+=15}
  row("Cliente",p.cliente);row("Valor do projeto",dinheiro(p.valor_projeto));row("Carência",p.carencia);row("Banco/Instituição",p.banco);row("Validade",p.validade);row("Primeiro pagamento",p.primeiro_pagamento);
  y+=5;txt("Opções de parcelamento",14,y,14,true,[0,0,0]);y+=10;
  d.setFillColor(250,204,21);d.roundedRect(14,y,182,10,2,2,"F");txt("Parcelas",34,y+7,9,true,[0,0,0]);txt("Valor da parcela",112,y+7,9,true,[0,0,0]);y+=16;
  opcoesDaProposta(p).forEach(o=>{txt(`${o.parcelas||"-"}x`,38,y,11,true);txt(dinheiro(o.valor),112,y,11,false);d.setDrawColor(...gray);d.line(14,y+6,196,y+6);y+=14});
  y+=6;txt("Observações",14,y,12,true);y+=8;d.setFont("helvetica","normal");d.setFontSize(10);d.text(d.splitTextToSize(p.observacoes||"Os valores estão sujeitos à análise e aprovação da instituição financeira.",182),14,y);
  d.setDrawColor(...yellow);d.setLineWidth(.45);d.line(10,250,200,250);
  txt("MF Elétrica e Solar",88,263,10,true,[0,0,0]);txt("Soluções inteligentes em energia",77,269,8,false,[0,0,0]);txt("Documento gerado automaticamente pelo sistema.",126,269,8,false,[0,0,0]);
  d.save("proposta-financiamento-"+Date.now()+".pdf")
}
const filtrados=useMemo(()=>alertas.filter(a=>`${a.cliente} ${a.painel} ${a.situacao}`.toLowerCase().includes(busca.toLowerCase())),[alertas,busca]),pend=alertas.filter(a=>a.status!=="Resolvido").length,res=alertas.filter(a=>a.status==="Resolvido").length;
const totalAlertas=alertas.length,totalOS=agenda.length,totalRelatorios=relatorios.length,totalPropostas=propostas.length;
const urgentes=alertas.filter(a=>a.prioridade==="Urgente"||a.prioridade==="Alta").length;
const painelTop=(()=>{let m={};alertas.forEach(a=>m[a.painel]=(m[a.painel]||0)+1);let e=Object.entries(m).sort((a,b)=>b[1]-a[1])[0];return e?`${e[0]} (${e[1]})`:"Sem dados"})()
const taxaResolucao=totalAlertas?Math.round((res/totalAlertas)*100):0;
const agendaHoje=agenda.filter(s=>s.data===new Date().toISOString().slice(0,10)).length;
const ultimosEventos=[...alertas.slice(0,3).map(a=>({tipo:"Alerta",titulo:a.cliente,desc:a.situacao,status:a.status})),...agenda.slice(0,3).map(s=>({tipo:"Agenda",titulo:s.local,desc:s.servico,status:s.status})),...relatorios.slice(0,3).map(r=>({tipo:"Relatório",titulo:r.cliente,desc:r.atividade,status:r.status}))].slice(0,6);
if(osPublicoId)return <PublicOS os={osPublica} loading={carregandoOs} onPdf={pdf} osNumero={osNumero}/>;
return <div className="app"><aside><div className="brand"><img src="/logo.png"/><div><b>MF Elétrica e Solar</b><span>Gestão Técnica</span></div></div><nav>{["dashboard","alertas","clientes","agenda","relatorios","propostas"].map(x=><button key={x} className={aba===x?"active":""} onClick={()=>setAba(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}</nav><div className="db">🟡 <div><b>Banco online</b><span>Supabase conectado</span></div></div></aside><main><section className="hero"><div><small>⚡ Sistema operacional premium</small><h1>MF Elétrica e Solar</h1><p>Controle de alertas, clientes, agenda técnica e relatórios com banco de dados online.</p></div><button onClick={atualizarManual}>↻ Atualizar</button></section>{msg&&<div className="msg">{msg}</div>}
{aba==="dashboard"&&<>
<section className="dashHero">
  <div>
    <span>Central operacional</span>
    <h2>Dashboard avançado</h2>
    <p>Visão rápida dos alertas, tarefas, relatórios, painéis com mais ocorrências e produtividade técnica.</p>
  </div>
  <div className="scoreBox">
    <small>Taxa de resolução</small>
    <strong>{taxaResolucao}%</strong>
  </div>
</section>
<section className="metrics">
  <Card t="Alertas pendentes" v={pend} d="Precisam de acompanhamento"/>
  <Card t="Alertas resolvidos" v={res} d="Ocorrências finalizadas"/>
  <Card t="Ocorrências críticas" v={urgentes} d="Alta prioridade ou urgente"/>
  <Card t="Agenda de hoje" v={agendaHoje} d="Serviços programados"/>
</section>
<section className="advancedGrid">
  <div className="panel">
    <h2>Status operacional</h2>
    <div className="statusRows">
      <div><span>Pendentes</span><b>{pend}</b></div>
      <div><span>Resolvidos</span><b>{res}</b></div>
      <div><span>Relatórios</span><b>{totalRelatorios}</b></div>
      <div><span>Tarefas/OS</span><b>{totalOS}</b></div>
    </div>
  </div>
  <div className="panel">
    <h2>Painel com mais alertas</h2>
    <div className="bigInsight">{painelTop}</div>
    <p className="muted">Ajuda a identificar qual plataforma exige mais atenção.</p>
  </div>
  <div className="panel wide">
    <h2>Últimos movimentos</h2>
    {ultimosEventos.length===0&&<div className="empty">Nenhuma movimentação ainda.</div>}
    {ultimosEventos.map((e,i)=><div className="timeline" key={i}><div className="dot"></div><div><b>{e.tipo} • {e.titulo}</b><p>{e.desc}</p><small>{e.status}</small></div></div>)}
  </div>
  <div className="panel">
    <h2>Painéis monitorados</h2>
    <div className="chips">{PAINEIS.map(p=><span key={p}>{p}</span>)}</div>
  </div>
</section>
<section className="grid">
  <Panel title="Ocorrências recentes">{alertas.slice(0,5).map(a=><Item key={a.id} x={a} title={a.cliente} text={a.situacao} sub={`${a.painel} • ${a.status}`}/>)}</Panel>
  <Panel title="Resumo da operação"><div className="miniStats"><p><b>{clientes.length}</b> clientes cadastrados</p><p><b>{totalAlertas}</b> alertas totais</p><p><b>{totalRelatorios}</b> relatórios emitidos</p><p><b>{totalPropostas}</b> propostas comerciais</p></div></Panel>
</section>
</>}
{aba==="alertas"&&<Area><Form title={edit?.tabela==="alertas"?"Editar alerta":"Novo alerta"} edit={edit?.tabela==="alertas"} cancel={cancelar} file={setArq} submit={e=>{e.preventDefault();salvar("alertas",alerta,()=>setAlerta(VA))}}><Campo l="Cliente" v={alerta.cliente} s={v=>setAlerta({...alerta,cliente:v})}/><Select l="Painel" v={alerta.painel} o={PAINEIS} s={v=>setAlerta({...alerta,painel:v})}/><Texto l="Situação" v={alerta.situacao} s={v=>setAlerta({...alerta,situacao:v})}/><Select l="Prioridade" v={alerta.prioridade} o={PRIOR} s={v=>setAlerta({...alerta,prioridade:v})}/><Select l="Status" v={alerta.status} o={STATUS} s={v=>setAlerta({...alerta,status:v})}/><Campo l="Responsável" v={alerta.responsavel} s={v=>setAlerta({...alerta,responsavel:v})}/><Texto l="Observação" v={alerta.observacao} s={v=>setAlerta({...alerta,observacao:v})}/></Form><Panel title="Alertas registrados"><input placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/>{filtrados.map(a=><Item key={a.id} x={a} title={a.cliente} text={a.situacao} sub={`${a.painel} • ${a.prioridade} • ${a.status}`} extra={<><select value={a.status} onChange={e=>stat(a.id,e.target.value)}>{STATUS.map(s=><option key={s}>{s}</option>)}</select><button onClick={()=>pdf("Alerta Técnico",a)}>PDF</button><button onClick={()=>editar("alertas",a)}>Editar</button><button className="danger" onClick={()=>del("alertas",a.id)}>Excluir</button></>}/>)}</Panel></Area>}
{aba==="clientes"&&<Area><Form title={edit?.tabela==="clientes"?"Editar cliente":"Novo cliente"} edit={edit?.tabela==="clientes"} cancel={cancelar} noFile submit={e=>{e.preventDefault();salvar("clientes",cliente,()=>setCliente(VC))}}><Campo l="Nome" v={cliente.nome} s={v=>setCliente({...cliente,nome:v})}/><Campo l="Contato" v={cliente.contato} s={v=>setCliente({...cliente,contato:v})}/><Campo l="Cidade/Bairro" v={cliente.cidade} s={v=>setCliente({...cliente,cidade:v})}/><Select l="Painel" v={cliente.painel} o={PAINEIS} s={v=>setCliente({...cliente,painel:v})}/><Campo l="Potência" v={cliente.potencia} s={v=>setCliente({...cliente,potencia:v})}/><Campo l="Status" v={cliente.status} s={v=>setCliente({...cliente,status:v})}/></Form><Panel title="Clientes">{clientes.map(c=><Item key={c.id} title={c.nome} text={c.cidade||""} sub={`${c.painel} • ${c.status}`} extra={<><button onClick={()=>editar("clientes",c)}>Editar</button><button className="danger" onClick={()=>del("clientes",c.id)}>Excluir</button></>}/>)}</Panel></Area>}
{aba==="agenda"&&<Area><Form title={edit?.tabela==="agenda"?"Editar tarefa":"Nova tarefa"} edit={edit?.tabela==="agenda"} cancel={cancelar} file={setArq} submit={e=>{e.preventDefault();salvar("agenda",serv,()=>setServ(VG))}}><Campo l="Data" type="date" v={serv.data} s={v=>setServ({...serv,data:v})}/><Campo l="Horário" type="time" v={serv.horario} s={v=>setServ({...serv,horario:v})}/><Campo l="Local/Cliente" v={serv.local} s={v=>setServ({...serv,local:v})}/><Select l="Tipo de OS" v={serv.tipo_os} o={["Manutenção","Instalação","Vistoria","Retorno","Emergência"]} s={v=>setServ({...serv,tipo_os:v})}/><Texto l="Serviço a fazer" v={serv.servico} s={v=>setServ({...serv,servico:v})}/><Campo l="Equipe/Técnico" v={serv.equipe} s={v=>setServ({...serv,equipe:v})}/><Select l="Status da OS" v={serv.status} o={STATUS_OS} s={v=>setServ({...serv,status:v})}/><Texto l="Diagnóstico técnico" v={serv.diagnostico} s={v=>setServ({...serv,diagnostico:v})}/><Texto l="Solução aplicada" v={serv.solucao} s={v=>setServ({...serv,solucao:v})}/><Campo l="Nome de quem assinou" v={serv.assinatura_nome} s={v=>setServ({...serv,assinatura_nome:v})}/><SignaturePad value={assinatura} onChange={setAssinatura}/></Form><Panel title="Agenda">{agenda.map(s=><div className="osCard" key={s.id}>
  <div className="osTop">
    <div><strong>{osNumero(s)}</strong><h3>{s.local}</h3><p>{s.servico}</p><small>{s.data} {s.horario||""} • {s.equipe||"Sem técnico"} • {s.tipo_os||"OS"}</small></div>
    <span className="osStatus">{s.status}</span>
  </div>
  <div className="progress"><div style={{width:progressoOS(s.status)+"%"}}></div></div>
  <div className="osTimeline">
    <div className={progressoOS(s.status)>=20?"done":""}>Criada</div>
    <div className={progressoOS(s.status)>=60?"done":""}>Em execução</div>
    <div className={progressoOS(s.status)>=100?"done":""}>Finalizada</div>
  </div>
  {(s.diagnostico||s.solucao)&&<div className="osNotes">{s.diagnostico&&<p><b>Diagnóstico:</b> {s.diagnostico}</p>}{s.solucao&&<p><b>Solução:</b> {s.solucao}</p>}</div>}
  {s.arquivo_url&&<a href={s.arquivo_url} target="_blank">Abrir anexo</a>}{s.assinatura_url&&<div className="sigPreview"><b>Assinatura registrada</b><img src={s.assinatura_url}/></div>}
  <div className="actions">
    <select value={s.status} onChange={e=>statOS(s.id,e.target.value)}>{STATUS_OS.map(st=><option key={st}>{st}</option>)}</select>
    <button onClick={()=>pdf("Tarefa Técnica",s)}>PDF OS</button>
    <button onClick={()=>editar("agenda",s)}>Editar</button>
    <button className="danger" onClick={()=>del("agenda",s.id)}>Excluir</button>
  </div>
</div>)}</Panel></Area>}
{aba==="relatorios"&&<Area><Form title={edit?.tabela==="relatorios"?"Editar relatório":"Novo relatório"} edit={edit?.tabela==="relatorios"} cancel={cancelar} file={setArq} submit={e=>{e.preventDefault();salvar("relatorios",rel,()=>setRel(VR))}}><Campo l="Dia" type="date" v={rel.dia} s={v=>setRel({...rel,dia:v})}/><Campo l="Cliente" v={rel.cliente} s={v=>setRel({...rel,cliente:v})}/><Texto l="Atividade realizada" v={rel.atividade} s={v=>setRel({...rel,atividade:v})}/><Texto l="Resultado" v={rel.resultado} s={v=>setRel({...rel,resultado:v})}/><Campo l="Responsável" v={rel.responsavel} s={v=>setRel({...rel,responsavel:v})}/><Campo l="Status" v={rel.status} s={v=>setRel({...rel,status:v})}/></Form><Panel title="Relatórios">{relatorios.map(r=><Item key={r.id} x={r} title={r.cliente} text={r.atividade} sub={`${r.dia} • ${r.status}`} extra={<><button onClick={()=>pdf("Relatório Técnico",r)}>PDF</button><button onClick={()=>editar("relatorios",r)}>Editar</button><button className="danger" onClick={()=>del("relatorios",r.id)}>Excluir</button></>}/>)}</Panel></Area>}
{aba==="propostas"&&<Area>
<Form title={edit?.tabela==="propostas"?"Editar proposta":"Nova proposta de financiamento"} edit={edit?.tabela==="propostas"} cancel={cancelar} noFile submit={e=>{e.preventDefault();salvar("propostas",proposta,()=>setProposta(VP))}}>
  <Campo l="Cliente" v={proposta.cliente} s={v=>setProposta({...proposta,cliente:v})}/>
  <Campo l="Valor do projeto" v={proposta.valor_projeto} s={v=>setProposta({...proposta,valor_projeto:v})}/>
  <Campo l="Carência" v={proposta.carencia} s={v=>setProposta({...proposta,carencia:v})}/>
  <Campo l="Banco/Instituição" v={proposta.banco} s={v=>setProposta({...proposta,banco:v})}/>
  <Campo l="Validade da proposta" type="date" v={proposta.validade} s={v=>setProposta({...proposta,validade:v})}/><Campo l="Data do primeiro pagamento" type="date" v={proposta.primeiro_pagamento} s={v=>setProposta({...proposta,primeiro_pagamento:v})}/>
  <div className="proposalOptions"><span>Opções de parcelamento</span>{(proposta.opcoes||[]).map((o,i)=><div className="proposalOption" key={i}><input placeholder="Parcelas. Ex: 48" value={o.parcelas||""} onChange={e=>setOpcao(i,"parcelas",e.target.value)}/><input placeholder="Valor. Ex: 576,13" value={o.valor||""} onChange={e=>setOpcao(i,"valor",e.target.value)}/><button type="button" onClick={()=>removeOpcao(i)}>Remover</button></div>)}<button type="button" onClick={addOpcao}>+ Adicionar opção</button></div>
  <Texto l="Observações" v={proposta.observacoes} s={v=>setProposta({...proposta,observacoes:v})}/>
</Form>
<Panel title="Propostas cadastradas">
  {propostas.map(p=><div className="proposalCard" key={p.id}><div><b>{p.cliente}</b><p>Projeto: {dinheiro(p.valor_projeto)} • Carência: {p.carencia||"-"} • 1º pagamento: {p.primeiro_pagamento||"-"}</p><small>{opcoesDaProposta(p).map(o=>`${o.parcelas}x de ${dinheiro(o.valor)}`).join(" • ")}</small></div><div className="actions"><button onClick={()=>pdfProposta(p)}>PDF Proposta</button><button onClick={()=>editar("propostas",p)}>Editar</button><button className="danger" onClick={()=>del("propostas",p.id)}>Excluir</button></div></div>)}
  {propostas.length===0&&<div className="empty">Nenhuma proposta cadastrada ainda.</div>}
</Panel>
</Area>}
</main></div>}
function Card(p){return <div className="card"><p>{p.t}</p><h2>{p.v}</h2><span>{p.d}</span></div>}
function Panel({title,children}){return <div className="panel"><h2>{title}</h2>{children}</div>}
function Area({children}){return <section className="area">{children}</section>}
function Form({title,submit,children,edit,cancel,file,noFile}){return <form className="form panel" onSubmit={submit}><h2>{title}</h2>{children}{!noFile&&<label><span>Anexo/foto</span><input type="file" onChange={e=>file(e.target.files[0])}/></label>}<div className="actions"><button className="submit">{edit?"Salvar alteração":"Salvar"}</button>{edit&&<button type="button" onClick={cancel}>Cancelar</button>}</div></form>}
function Campo({l,v,s,type="text"}){return <label><span>{l}</span><input type={type} value={v||""} onChange={e=>s(e.target.value)}/></label>}
function Texto({l,v,s}){return <label><span>{l}</span><textarea value={v||""} onChange={e=>s(e.target.value)}/></label>}
function Select({l,v,o,s}){return <label><span>{l}</span><select value={v||""} onChange={e=>s(e.target.value)}>{o.map(x=><option key={x}>{x}</option>)}</select></label>}
function Item({title,text,sub,extra,x}){return <div className="item"><div><b>{title}</b><p>{text}</p><small>{sub}</small>{x?.arquivo_url&&<a href={x.arquivo_url} target="_blank">Abrir anexo</a>}</div><div className="actions">{extra}</div></div>}


function PublicOS({os,loading,onPdf,osNumero}){
  if(loading)return <div className="publicOs"><div className="publicCard"><h1>Carregando OS...</h1></div></div>;
  if(!os)return <div className="publicOs"><div className="publicCard"><h1>OS não encontrada</h1><p>Verifique se o QR Code foi gerado corretamente.</p></div></div>;
  return <div className="publicOs">
    <div className="publicCard">
      <div className="publicBrand"><img src="/logo.png"/><div><b>MF Elétrica e Solar</b><span>Ordem de Serviço Técnica</span></div></div>
      <div className="publicHeader"><div><small>{osNumero(os)}</small><h1>{os.local}</h1><p>{os.servico}</p></div><span>{os.status}</span></div>
      <div className="publicGrid">
        <div><b>Tipo de OS</b><p>{os.tipo_os||"-"}</p></div>
        <div><b>Data/Horário</b><p>{os.data||"-"} {os.horario||""}</p></div>
        <div><b>Técnico</b><p>{os.equipe||"-"}</p></div>
        <div><b>Status</b><p>{os.status||"-"}</p></div>
      </div>
      <section><h2>Diagnóstico</h2><p>{os.diagnostico||"-"}</p></section>
      <section><h2>Solução aplicada</h2><p>{os.solucao||"-"}</p></section>
      {os.assinatura_url&&<section><h2>Assinatura</h2><div className="publicSignature"><img src={os.assinatura_url}/><small>{os.assinatura_nome||"Assinatura registrada"}</small></div></section>}
      {os.arquivo_url&&<a className="publicBtn" href={os.arquivo_url} target="_blank">Abrir anexo</a>}
      <button className="publicBtn" onClick={()=>onPdf("Tarefa Técnica",os)}>Baixar PDF da OS</button>
    </div>
  </div>
}

function SignaturePad({value,onChange}){
const [paths,setPaths]=React.useState([]);
const pathsRef=React.useRef([]);
const drawing=React.useRef(false);
const svgRef=React.useRef(null);

function getPoint(e){
  const rect=svgRef.current.getBoundingClientRect();
  const t=e.touches?.[0] || e.changedTouches?.[0];
  const clientX=t?t.clientX:e.clientX;
  const clientY=t?t.clientY:e.clientY;
  return {x:clientX-rect.left,y:clientY-rect.top};
}

function pathFromPoints(points){
  if(!points.length)return "";
  return "M "+points.map(p=>`${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
}

function exportPng(currentPaths){
  const svg=svgRef.current;
  const rect=svg.getBoundingClientRect();
  const width=Math.max(600,Math.floor(rect.width*2));
  const height=Math.max(260,Math.floor(rect.height*2));
  const scaleX=width/rect.width;
  const scaleY=height/rect.height;

  const body=currentPaths.map(points=>{
    const d=points.map((p,i)=>`${i===0?"M":"L"} ${(p.x*scaleX).toFixed(1)} ${(p.y*scaleY).toFixed(1)}`).join(" ");
    return `<path d="${d}" fill="none" stroke="#111111" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");

  const svgText=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${body}</svg>`;
  const img=new Image();
  const blob=new Blob([svgText],{type:"image/svg+xml;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  img.onload=()=>{
    const canvas=document.createElement("canvas");
    canvas.width=width;
    canvas.height=height;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,width,height);
    ctx.drawImage(img,0,0);
    URL.revokeObjectURL(url);
    onChange(canvas.toDataURL("image/png"));
  };
  img.src=url;
}

function startDraw(e){
  e.preventDefault();
  e.stopPropagation();
  drawing.current=true;
  const p=getPoint(e);
  const next=[...pathsRef.current,[p]];
  pathsRef.current=next;
  setPaths(next);
}

function moveDraw(e){
  if(!drawing.current)return;
  e.preventDefault();
  e.stopPropagation();
  const p=getPoint(e);
  const next=pathsRef.current.map((stroke,i)=>i===pathsRef.current.length-1?[...stroke,p]:stroke);
  pathsRef.current=next;
  setPaths(next);
}

function endDraw(e){
  if(e){
    e.preventDefault();
    e.stopPropagation();
  }
  if(!drawing.current)return;
  drawing.current=false;
  exportPng(pathsRef.current);
}

function limpar(){
  pathsRef.current=[];
  setPaths([]);
  onChange("");
}

return <div className="signatureBox">
  <span>Assinatura digital</span>
  <div className="signatureSvgWrap">
    {value && paths.length===0 && <img className="signatureExisting" src={value}/>}
    <svg
      ref={svgRef}
      className="signatureSvg"
      onTouchStart={startDraw}
      onTouchMove={moveDraw}
      onTouchEnd={endDraw}
      onMouseDown={startDraw}
      onMouseMove={moveDraw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
    >
      <rect x="0" y="0" width="100%" height="100%" fill="#fff"></rect>
      {paths.map((stroke,i)=><path key={i} d={pathFromPoints(stroke)} fill="none" stroke="#111" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>)}
    </svg>
  </div>
  <button type="button" onClick={limpar}>Limpar assinatura</button>
</div>}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
