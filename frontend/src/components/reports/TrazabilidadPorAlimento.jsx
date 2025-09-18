import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { exportToPdf } from '../../utils/exportToPdf';

const API_ALIMS = 'http://localhost:5000/api/alimentaciones';
const API_PORCINOS = 'http://localhost:5000/api/porcinos';
const API_REP = 'http://localhost:5000/api/reportes/trazabilidad-por-alimento';

export default function TrazabilidadPorAlimento() {
  const [alimentaciones, setAlims] = useState([]);
  const [porcinos, setPorcinos] = useState([]);
  const [modo, setModo] = useState('local'); // 'local' | 'server'
  const [filtros, setFiltros] = useState({ alimentacionId: '', fi: '', ff: '' });
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch(API_ALIMS).then(r => r.json()).then(setAlims);
    fetch(API_PORCINOS).then(r => r.json()).then(setPorcinos);
  }, []);

  async function consultar() {
    const { alimentacionId, fi, ff } = filtros;
    if (modo === 'server') {
      try {
        Swal.fire({ title:'Consultando...', allowOutsideClick:false, didOpen:()=>Swal.showLoading() });
        const q = new URLSearchParams();
        if (alimentacionId) q.append('alimentacionId', alimentacionId);
        if (fi) q.append('fechaInicio', fi);
        if (ff) q.append('fechaFin', ff);
        const res = await fetch(`${API_REP}?${q.toString()}`);
        const data = await res.json();
        Swal.close();
        if (!res.ok) return Swal.fire('Error', data.mensaje || 'Error en consulta', 'error');
        setRows(data.rows || []);
      } catch {
        Swal.close(); Swal.fire('Error','Error de conexión','error');
      }
    } else {
      // Local: recorrer historiales en memoria
      const fiDate = fi ? new Date(fi) : new Date('1970-01-01');
      const ffDate = ff ? new Date(new Date(ff).getTime() + 24*60*60*1000) : new Date('2999-12-31');
      const out = [];
      porcinos.forEach(p => {
        (p.historialAlimentacion || []).forEach(h => {
          const fecha = new Date(h.fecha);
          if (fecha < fiDate || fecha >= ffDate) return;
          const coincideAlim = alimentacionId ? (String(h.alimentacion?._id) === String(alimentacionId)) : true;
          if (!coincideAlim) return;
          const alimento = h.alimentacion?._id ? (h.alimentacion?.nombre || '') : (h.nombreSnapshot || 'Alimento (histórico)');
          out.push({
            fecha, porcino: p.identificacion,
            cliente: `${p.cliente?.nombres || ''} ${p.cliente?.apellidos || ''}`.trim(),
            alimento, dosis: h.dosis
          });
        });
      });
      out.sort((a,b)=>a.fecha-b.fecha);
      setRows(out);
    }
  }

  function exportPdf() {
    const columns = ['Fecha','Porcino','Cliente','Alimento','Dosis (lbs)'];
    const data = rows.map(r => [new Date(r.fecha).toLocaleDateString(), r.porcino, r.cliente, r.alimento, r.dosis]);
    exportToPdf({
      title: 'Trazabilidad por alimento',
      subtitle: filtros.alimentacionId ? (alimentaciones.find(a=>a._id===filtros.alimentacionId)?.nombre || '') : 'Todos',
      columns, rows: data,
      fileName: `trazabilidad_${new Date().toISOString().slice(0,10)}_.pdf`
    });
  }

  return (
    <section className="section card">
      <h3>Trazabilidad por alimento</h3>
      <div className="form-row">
        <div>
          <label>Alimento</label>
          <select value={filtros.alimentacionId} onChange={e=>setFiltros({...filtros, alimentacionId: e.target.value})}>
            <option value="">Todos</option>
            {alimentaciones.map(a => <option key={a._id} value={a._id}>{a.nombre}</option>)}
          </select>
        </div>
        <div>
          <label>Desde</label>
          <input type="date" value={filtros.fi} onChange={e=>setFiltros({...filtros, fi: e.target.value})}/>
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" value={filtros.ff} onChange={e=>setFiltros({...filtros, ff: e.target.value})}/>
        </div>
      </div>
      <div className="form-actions" style={{justifyContent:'space-between'}}>
        <div>
          <label style={{marginRight:8}}>Modo</label>
          <select value={modo} onChange={e=>setModo(e.target.value)}>
            <option value="local">Local (rápido)</option>
            <option value="server">Servidor (grandes volúmenes)</option>
          </select>
        </div>
        <div>
          <button className="btn btn-outline" onClick={consultar}>Consultar</button>
          <button className="btn btn-primary" onClick={exportPdf} disabled={!rows.length}>Exportar PDF</button>
        </div>
      </div>

      <table>
        <thead><tr><th>Fecha</th><th>Porcino</th><th>Cliente</th><th>Alimento</th><th>Dosis (lbs)</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td>{new Date(r.fecha).toLocaleDateString()}</td>
              <td>{r.porcino}</td>
              <td>{r.cliente}</td>
              <td>{r.alimento}</td>
              <td>{r.dosis}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan="5">Sin resultados</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
