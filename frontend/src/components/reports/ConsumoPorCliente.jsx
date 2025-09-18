import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { exportToPdf } from '../../utils/exportToPdf';

const API_PORCINOS = 'http://localhost:5000/api/porcinos';
const API_REP = 'http://localhost:5000/api/reportes/consumo-por-cliente';

export default function ConsumoPorCliente() {
  const [modo, setModo] = useState('local');
  const [fi, setFi] = useState(''); const [ff, setFf] = useState('');
  const [porcinos, setPorcinos] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(()=>{ fetch(API_PORCINOS).then(r=>r.json()).then(setPorcinos); },[]);

  async function consultar() {
    const fiDate = fi ? new Date(fi) : new Date('1970-01-01');
    const ffDate = ff ? new Date(new Date(ff).getTime() + 24*60*60*1000) : new Date('2999-12-31');

    if (modo==='server') {
      try{
        Swal.fire({title:'Consultando...',allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
        const q = new URLSearchParams(); if (fi) q.append('fechaInicio',fi); if (ff) q.append('fechaFin',ff);
        const res = await fetch(`${API_REP}?${q.toString()}`); const data = await res.json();
        Swal.close(); if (!res.ok) return Swal.fire('Error', data.mensaje || 'Error', 'error');
        setRows(data.rows || []);
      }catch{ Swal.close(); Swal.fire('Error','Error de conexión','error'); }
    } else {
      const map = new Map();
      porcinos.forEach(p=>{
        const cliente = `${p.cliente?.nombres||''} ${p.cliente?.apellidos||''}`.trim() || '(sin cliente)';
        (p.historialAlimentacion||[]).forEach(h=>{
          const f=new Date(h.fecha); if (f<fiDate||f>=ffDate) return;
          const key = cliente;
          if (!map.has(key)) map.set(key, { cliente, eventos: 0, totalLbs: 0, porcinos: new Set() });
          const obj = map.get(key);
          obj.eventos += 1; obj.totalLbs += Number(h.dosis||0); obj.porcinos.add(p.identificacion);
        });
      });
      const out = [...map.values()].map(x => ({ cliente:x.cliente, eventos:x.eventos, totalLbs: x.totalLbs, porcinos: x.porcinos.size }))
        .sort((a,b)=>b.totalLbs-a.totalLbs);
      setRows(out);
    }
  }

  function exportPdf(){
    const columns = ['Cliente','Porcinos','Eventos','Total (lbs)'];
    const data = rows.map(r=>[r.cliente,r.porcinos,r.eventos,r.totalLbs]);
    exportToPdf({ title:'Consumo por cliente', subtitle: fi||ff ? `Periodo: ${fi||'inicio'} a ${ff||'fin'}` : 'Periodo completo', columns, rows:data, fileName:`consumo_clientes_${new Date().toISOString().slice(0,10)}.pdf` });
  }

  return (
    <section className="section card">
      <h3>Consumo por cliente</h3>
      <div className="form-row">
        <div><label>Desde</label><input type="date" value={fi} onChange={e=>setFi(e.target.value)} /></div>
        <div><label>Hasta</label><input type="date" value={ff} onChange={e=>setFf(e.target.value)} /></div>
      </div>
      <div className="form-actions" style={{justifyContent:'space-between'}}>
        <div>
          <label style={{marginRight:8}}>Modo</label>
          <select value={modo} onChange={e=>setModo(e.target.value)}>
            <option value="local">Local</option><option value="server">Servidor</option>
          </select>
        </div>
        <div>
          <button className="btn btn-outline" onClick={consultar}>Consultar</button>
          <button className="btn btn-primary" onClick={exportPdf} disabled={!rows.length}>Exportar PDF</button>
        </div>
      </div>
      <table>
        <thead><tr><th>Cliente</th><th>Porcinos</th><th>Eventos</th><th>Total (lbs)</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(<tr key={i}><td>{r.cliente}</td><td>{r.porcinos}</td><td>{r.eventos}</td><td>{r.totalLbs}</td></tr>))}
          {!rows.length && <tr><td colSpan="4">Sin resultados</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
