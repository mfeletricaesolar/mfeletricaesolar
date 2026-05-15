
import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

function App() {
  return (
    <div className="container">
      <header className="header">
  <img src="/logo.png" alt="MF Elétrica Solar" className="logo" />

  <div>
    <h1>MF Elétrica Solar</h1>
    <p>Sistema Profissional de Monitoramento</p>
  </div>
</header>

      <div className="cards">
        <div className="card">
          <h2>Alertas</h2>
          <p>Controle de falhas e monitoramento dos clientes.</p>
        </div>

        <div className="card">
          <h2>Agenda</h2>
          <p>Organização de serviços e visitas técnicas.</p>
        </div>

        <div className="card">
          <h2>Relatórios</h2>
          <p>Registro diário das atividades realizadas.</p>
        </div>
      </div>

      <section className="panel">
        <h2>Painéis Monitorados</h2>
        <ul>
          <li>SOLARMAN</li>
          <li>SOLIS</li>
          <li>GOODWE</li>
          <li>RENAC</li>
          <li>ELEKEEPER</li>
          <li>AUXSOL</li>
        </ul>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
