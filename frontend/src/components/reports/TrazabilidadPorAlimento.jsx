import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import Swal from 'sweetalert2';
import { exportToPdf } from '../../utils/exportToPdf';
import { Q_TRAZABILIDAD } from '../../graphql/reportes.gql';
import { useQuery as useApolloQuery } from '@apollo/client'; // si ya usas hooks centralizados, importa useTrazabilidad en su lugar

export default function TrazabilidadPorAlimento() {
  // Filtros controlados
  const [filtros, setFiltros] = useState({ alimentacionId: '', fechaInicio: '', fechaFin: '' });

  const variables = useMemo(() => ({
    alimentacionId: filtros.alimentacionId || null,
    rango: {
      fechaInicio: filtros.fechaInicio || null,
      fechaFin: filtros.fechaFin || null,
    },
  }), [filtros]);

  const { data, loading, error, refetch } = useApolloQuery(Q_TRAZABILIDAD, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const rows = data?.trazabilidadPorAlimento || [];

  function onChange(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }

  function exportPdf() {
    if (!rows.length) return;
    const columns = ['Fecha','Porcino','Cliente','Alimento','Dosis (lbs)'];
    const body = rows.map(r => [
      r.fecha ? new Date(r.fecha).toLocaleDateString() : '',
      r.porcino || '—',
      r.cliente || '—',
      r.alimento || '—',
      r.dosis ?? 0,
    ]);
    exportToPdf({
      title: 'Trazabilidad por alimento',
      subtitle: filtros.alimentacionId ? `Alimento ID: ${filtros.alimentacionId}` : 'Todos',
      columns,
      rows: body,
      fileName: `trazabilidad_${new Date().toISOString().slice(0,10)}.pdf`,
    });
  }

  return (
    <section className="section card">
      <h3>Trazabilidad por alimento</h3>

      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <label className="form-label">Alimentación (Mongo _id)</label>
          <input
            className="form-control"
            name="alimentacionId"
            value={filtros.alimentacionId}
            onChange={onChange}
            placeholder="Opcional"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Desde</label>
          <input type="date" className="form-control" name="fechaInicio" value={filtros.fechaInicio} onChange={onChange}/>
        </div>
        <div className="col-md-3">
          <label className="form-label">Hasta</label>
          <input type="date" className="form-control" name="fechaFin" value={filtros.fechaFin} onChange={onChange}/>
        </div>
        <div className="col-md-2 d-flex align-items-end gap-2">
          <button className="btn btn-outline" onClick={() => refetch()}>Consultar</button>
          <button className="btn btn-primary" onClick={exportPdf} disabled={!rows.length}>Exportar PDF</button>
        </div>
      </div>

      {loading && <div>Cargando...</div>}
      {error && <div className="text-danger">Error: {error.message}</div>}

      <div className="table-responsive">
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th>Fecha</th><th>Porcino</th><th>Cliente</th><th>Alimento</th><th>Dosis (lb)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td>{r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}</td>
                <td>{r.porcino || '—'}</td>
                <td>{r.cliente || '—'}</td>
                <td>{r.alimento || '—'}</td>
                <td>{r.dosis ?? 0}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan="5" className="text-center">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
