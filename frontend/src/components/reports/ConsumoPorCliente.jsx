import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { exportToPdf } from '../../utils/exportToPdf';
import { useConsumoPorCliente } from '../../hooks/useReportes';

export default function ConsumoPorCliente() {
  const [fi, setFi] = useState('');
  const [ff, setFf] = useState('');
  const rango = { fechaInicio: fi || null, fechaFin: ff || null };

  const { data, loading, error, refetch } = useConsumoPorCliente(rango);
  const rows = data?.consumoPorCliente || [];

  async function consultar() {
    try {
      Swal.fire({ title: 'Consultando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await refetch({ rango });
      Swal.close();
    } catch (e) {
      Swal.close();
      Swal.fire('Error', e?.message || 'Error de conexión', 'error');
    }
  }

  function exportPdf() {
    const columns = ['Cliente', 'Porcinos', 'Eventos', 'Total (lbs)'];
    const dataRows = rows.map(r => [r.cliente || '(sin cliente)', r.porcinos, r.eventos, r.totalLbs]);
    exportToPdf({
      title: 'Consumo por cliente',
      subtitle: fi || ff ? `Periodo: ${fi || 'inicio'} a ${ff || 'fin'}` : 'Periodo completo',
      columns,
      rows: dataRows,
      fileName: `consumo_clientes_${new Date().toISOString().slice(0, 10)}.pdf`
    });
  }

  return (
    <section className="section card">
      <h3>Consumo por cliente</h3>
      <div className="form-row">
        <div>
          <label>Desde</label>
          <input type="date" value={fi} onChange={e => setFi(e.target.value)} />
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" value={ff} onChange={e => setFf(e.target.value)} />
        </div>
      </div>

      <div className="form-actions" style={{ justifyContent: 'space-between' }}>
        <div />
        <div>
          <button className="btn btn-outline" onClick={consultar} disabled={loading}>Consultar</button>
          <button className="btn btn-primary" onClick={exportPdf} disabled={!rows.length}>Exportar PDF</button>
        </div>
      </div>

      {error && <div className="text-danger">Error: {error.message}</div>}

      <table>
        <thead>
          <tr><th>Cliente</th><th>Porcinos</th><th>Eventos</th><th>Total (lbs)</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.cliente || '(sin cliente)'}</td>
              <td>{r.porcinos}</td>
              <td>{r.eventos}</td>
              <td>{r.totalLbs}</td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan="4">Sin resultados</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
