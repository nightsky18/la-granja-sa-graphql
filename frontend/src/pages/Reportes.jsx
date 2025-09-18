import React, { useState } from 'react';
import TrazabilidadPorAlimento from '../components/reports/TrazabilidadPorAlimento';
import ConsumoPorCliente from '../components/reports/ConsumoPorCliente';
import ConsumoPorAlimentacion from '../components/reports/ConsumoPorAlimentacion';

export default function Reportes() {
  const [tab, setTab] = useState('trazabilidad'); // 'trazabilidad' | 'cliente' | 'alimento'

  return (
    <div className="container main">
      <section className="section card">
        <h2>Reportes</h2>

        {/* Tabs simples */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={`btn ${tab==='trazabilidad' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('trazabilidad')}>
            Trazabilidad por alimento
          </button>
          <button className={`btn ${tab==='cliente' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('cliente')}>
            Consumo por cliente
          </button>
          <button className={`btn ${tab==='alimento' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('alimento')}>
            Consumo por alimentación
          </button>
        </div>

        {/* Contenido */}
        {tab === 'trazabilidad' && <TrazabilidadPorAlimento />}
        {tab === 'cliente' && <ConsumoPorCliente />}
        {tab === 'alimento' && <ConsumoPorAlimentacion />}
      </section>
    </div>
  );
}
