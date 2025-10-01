import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { exportToPdf } from '../../utils/exportToPdf';
import { useConsumoPorAlimentacion } from '../../hooks/useReportes';

export default function ConsumoPorAlimentacion() {
  const [fi, setFi] = useState('');
  const [ff, setFf] = useState('');
  const rango = useMemo(() => ({
    fechaInicio: fi || null,
    fechaFin: ff || null,
  }), [fi, ff]);

  const { data, loading, error, refetch } = useConsumoPorAlimentacion(rango);
  const rows = data?.consumoPorAlimentacion || [];

  function consultar() {
    Swal.fire({ title: 'Consultando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    refetch().finally(() => Swal.close());
  }

  function exportPdf() {
    const columns = ['Alimento', 'Eventos', 'Total (lbs)', '% período'];
    const total = rows.reduce((a, b) => a + (b.totalLbs || 0), 0) || 1;
    const out = rows.map(r => [r.alimento, r.eventos, r.totalLbs, `${(r.porcentaje ?? (r.totalLbs * 100 / total)).toFixed(1)}%`]);
    exportToPdf({
      title: 'Consumo por alimentación',
      subtitle: fi || ff ? `Periodo: ${fi || 'inicio'} a ${ff || 'fin'}` : 'Periodo completo',
      columns,
      rows: out,
      fileName: `consumo_alimentacion_${new Date().toISOString().slice(0,10)}.pdf`,
    });
  }

  return (
    <section className="section card">
      <h3>Consumo por alimentación</h3>
      <div className="form-row">
        <div><label>Desde</label><input type="date" value={fi} onChange={e => setFi(e.target.value)} /></div>
        <div><label>Hasta</label><input type="date" value={ff} onChange={e => setFf(e.target.value)} /></div>
      </div>

      <div className="form-actions" style={{ justifyContent: 'space-between' }}>
        <div />
        <div>
          <button className="btn btn-outline" onClick={consultar}>Consultar</button>
          <button className="btn btn-primary" onClick={exportPdf} disabled={!rows.length}>Exportar PDF</button>
        </div>
      </div>

      {loading && <div>Cargando...</div>}
      {error && <div className="text-danger">Error: {error.message}</div>}

      <table>
        <thead>
          <tr><th>Alimento</th><th>Eventos</th><th>Total (lbs)</th><th>% período</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.alimento}</td>
              <td>{r.eventos}</td>
              <td>{r.totalLbs}</td>
              <td>{(r.porcentaje ?? 0).toFixed ? `${r.porcentaje.toFixed(1)}%` : `${r.porcentaje || 0}%`}</td>
            </tr>
          ))}
          {!loading && rows.length === 0 && <tr><td colSpan="4">Sin resultados</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
