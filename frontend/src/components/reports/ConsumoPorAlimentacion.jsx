import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { exportToPdf } from '../../utils/exportToPdf';

const API_PORCINOS = 'http://localhost:5000/api/porcinos';
const API_REP = 'http://localhost:5000/api/reportes/consumo-por-alimentacion';

export default function ConsumoPorAlimentacion(){
  const [modo, setModo] = useState('local');
  const [fi,setFi]=useState(''); const [ff,setFf]=useState('');
  const [porcinos,setPorcinos]=useState([]); const [rows,setRows]=useState([]);

  useEffect(()=>{ fetch(API_PORCINOS).then(r=>r.json()).then(setPorcinos); },[]);

  async function consultar(){
    const fiDate = fi ? new Date(fi) : new Date('1970-01-01');
    const ffDate = ff ? new Date(new Date(ff).getTime() + 24*60*60*1000) : new Date('2999-12-31');

    if (modo==='server'){
      try{
        Swal.fire({title:'Consultando...',allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
        const q = new URLSearchParams(); if (fi) q.append('fechaInicio',fi); if (ff) q.append('fechaFin',ff);
        const res = await fetch(`${API_REP}?${q.toString()}`); const data = await res.json();
        Swal.close(); if (!res.ok) return Swal.fire('Error', data.mensaje || 'Error', 'error');
        setRows(data.rows || []);
      }catch{ Swal.close(); Swal.fire('Error','Error de conexión','error'); }
    } else {
      const map = new Map();
      porcinos.forEach(p => {
        (p.historialAlimentacion||[]).forEach(h=>{
          const f=new Date(h.fecha); if (f<fiDate||f>=ffDate) return;
          const nombre = h.alimentacion?._id ? (h.alimentacion?.nombre || '') : (h.nombreSnapshot || 'Alimento (histórico)');
          const key = nombre;
          if (!map.has(key)) map.set(key, { alimento:nombre, eventos:0, totalLbs:0 });
          const obj=map.get(key); obj.eventos += 1; obj.totalLbs += Number(h.dosis||0);
        });
      });
      const out=[...map.values()].sort((a,b)=>b.totalLbs-a.totalLbs);
      const total = out.reduce((a,b)=>a+b.totalLbs,0) || 1;
      out.forEach(r => r.porcentaje = +(r.totalLbs*100/total).toFixed(1));
      setRows(out);
    }
  }

  function exportPdf(){
    const columns = ['Alimento','Eventos','Total (lbs)','% período'];
    const data = rows.map(r=>[r.alimento,r.eventos,r.totalLbs, (r.porcentaje ?? ((r.totalLbs/(rows.reduce((a,b)=>a+(b.totalLbs||0),0)||1))*100)).toFixed ? (r.porcentaje+'%') : r.porcentaje]);
    exportToPdf({ title:'Consumo por alimentación', subtitle: fi||ff ? `Periodo: ${fi||'inicio'} a ${ff||'fin'}` : 'Periodo completo', columns, rows:data, fileName:`consumo_alimentacion_${new Date().toISOString().slice(0,10)}.pdf` });
  }

  return (
    <section className="section card">
      <h3>Consumo por alimentación</h3>
      <div className="form-row">
        <div><label>Desde</label><input type="date" value={fi} onChange={e=>setFi(e.target.value)} /></div>
        <div><label>Hasta</label><input type="date" value={ff} onChange={e=>setFf(e.target.value)} /></div>
      </div>
      <div className="form-actions" style={{justifyContent:'space-between'}}>
        <div>
          <label style={{marginRight:8}}>Modo</label>
          <select value={modo} onChange={e=>setModo(e.target.value)}><option value="local">Local</option><option value="server">Servidor</option></select>
        </div>
        <div>
          <button className="btn btn-outline" onClick={consultar}>Consultar</button>
          <button className="btn btn-primary" onClick={exportPdf} disabled={!rows.length}>Exportar PDF</button>
        </div>
      </div>
      <table>
        <thead><tr><th>Alimento</th><th>Eventos</th><th>Total (lbs)</th><th>% período</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(<tr key={i}><td>{r.alimento}</td><td>{r.eventos}</td><td>{r.totalLbs}</td><td>{(r.porcentaje ?? 0)+'%'}</td></tr>))}
          {!rows.length && <tr><td colSpan="4">Sin resultados</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
