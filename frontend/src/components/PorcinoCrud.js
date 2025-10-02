import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { exportToPdf } from '../utils/exportToPdf';
import ClienteCRUD from './ClienteCrud';
import AlimentacionCRUD from './AlimentacionCrud';
import EditarHistorialModal from './EditarHistorialModal';
import { usePorcinos } from '../hooks/usePorcinos';
import { Q_PORCINOS, M_ELIMINAR_HISTORIAL } from '../graphql/porcino.gql';
import { useMutation } from '@apollo/client';



export default function PorcinoCRUD() {
  // Datos desde GraphQL
  const { porcinos: qPorcinos, clientes: qClientes, alimentaciones: qAlims, crear, actualizar, eliminar, alimentar } = usePorcinos();

  // Estados locales de UI
  const [porcinos, setPorcinos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [alimentaciones, setAlimentaciones] = useState([]);

  const [editHistOpen, setEditHistOpen] = useState(false);
  const [registroEdit, setRegistroEdit] = useState(null);
  const [porcinoEditRef, setPorcinoEditRef] = useState(null);

  const [form, setForm] = useState({ identificacion: '', raza: 1, edad: '', peso: '', cliente: '' });
  const [editId, setEditId] = useState(null);

  const [showClienteForm, setShowClienteForm] = useState(false);
  const [showAlimentacionForm, setShowAlimentacionForm] = useState(false);

  const [alimentarModalOpen, setAlimentarModalOpen] = useState(false);
  const [porcinoSeleccionado, setPorcinoSeleccionado] = useState(null);
  const [alimentarForm, setAlimentarForm] = useState({ alimentacionId: '', dosis: '' });

  const [histModalOpen, setHistModalOpen] = useState(false);
  const [porcinoHist, setPorcinoHist] = useState(null);
const [eliminarHist] = useMutation(M_ELIMINAR_HISTORIAL, {
  update(cache, { data }) {
    const porc = data?.eliminarHistorialAlimentacion;
    if (!porc) return;
    const prev = cache.readQuery({ query: Q_PORCINOS });
    if (!prev?.porcinos) return;
    cache.writeQuery({
      query: Q_PORCINOS,
      data: { porcinos: prev.porcinos.map(p => (p._id === porc._id ? porc : p)) },
    });
  },
});



  // Sincronizar resultados de GraphQL con estados de UI
  useEffect(() => {
    if (qPorcinos.data?.porcinos) setPorcinos(qPorcinos.data.porcinos);
  }, [qPorcinos.data]);
  useEffect(() => {
    if (qClientes.data?.clientes) setClientes(qClientes.data.clientes);
  }, [qClientes.data]);
  useEffect(() => {
    if (qAlims.data?.alimentaciones) setAlimentaciones(qAlims.data.alimentaciones);
  }, [qAlims.data]);

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function validarFormulario() {
    if (!form.identificacion.trim() && !editId) { Swal.fire('Error', 'La identificación es obligatoria.', 'error'); return false; }
    if (form.edad === '' || Number(form.edad) < 0) { Swal.fire('Error', 'La edad debe ser un número no negativo (meses).', 'error'); return false; }
    if (form.peso === '' || Number(form.peso) < 0) { Swal.fire('Error', 'El peso debe ser un número no negativo (kg).', 'error'); return false; }
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (!validarFormulario()) return;

    const payload = {
      raza: Number(form.raza),
      edad: Number(form.edad),
      peso: Number(form.peso),
      clienteId: form.cliente || null,
    };

    try {
      if (editId) {
        await actualizar({ variables: { id: editId, data: payload } });
      } else {
        await crear({ variables: { data: { ...payload, identificacion: form.identificacion.trim() } } });
      }
      await Swal.fire('¡Éxito!', editId ? 'Porcino actualizado.' : 'Porcino creado.', 'success');
      setForm({ identificacion: '', raza: 1, edad: '', peso: '', cliente: '' });
      setEditId(null);
      qPorcinos.refetch();
    } catch (err) {
      const msg = err?.message || 'Error al guardar porcino.';
      if (/identificaci[óo]n.*duplicad/i.test(msg)) {
        return Swal.fire('Error', 'La identificación ya está registrada.', 'error');
      }
      return Swal.fire('Error', msg, 'error');
    }
  }

async function onEliminarClick(porcinoId, historialId) {
  if (!porcinoId || !historialId) {
    return Swal.fire('Error', 'No se encontró el identificador del registro de historial.', 'error');
  }
  const ok = await Swal.fire({ title: 'Eliminar registro?', icon: 'warning', showCancelButton: true });
  if (!ok.isConfirmed) return;

  const { data } = await eliminarHist({ variables: { porcinoId, historialId } });
  const porcUpdated = data?.eliminarHistorialAlimentacion;
  if (porcUpdated) {
    // 1) Actualiza la cache de la tabla
    const prev = qPorcinos.data?.porcinos || [];
    setPorcinos(prev.map(p => (p._id === porcUpdated._id ? porcUpdated : p)));
    // 2) Si el modal está abierto y es el mismo porcino, refresca su estado
    setPorcinoHist((curr) => (curr && curr._id === porcUpdated._id ? porcUpdated : curr));
  }
  // 3) Refresca stock para ver cambio en selects (si hay vista de stock)
  qAlims.refetch();
  await Swal.fire('Eliminado', 'Registro removido del historial.', 'success');
}


  function edit(p) {
    setForm({
      identificacion: p.identificacion,
      raza: p.raza,
      edad: p.edad,
      peso: p.peso,
      cliente: p.cliente?._id || '',
    });
    setEditId(p._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirEditarHist(p, reg) {
    setPorcinoEditRef(p);
    setRegistroEdit(reg);
    setEditHistOpen(true);
  }

async function eliminarRegistroHist(p, reg) {
    // Reemplazado por onEliminarClick
    const ok = await Swal.fire({
      title: '¿Eliminar registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline' },
      buttonsStyling: false,
    });
    if (!ok.isConfirmed) return;
    await eliminarHist({ variables: { porcinoId: p._id, historialId: reg._id } });
    await Swal.fire('Eliminado', 'Registro removido del historial.', 'success');
    qPorcinos.refetch();
  }

  

  async function del(id) {
    const confirm = await Swal.fire({
      title: '¿Eliminar porcino?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline' },
      buttonsStyling: false
    });
    if (!confirm.isConfirmed) return;

    try {
      await eliminar({ variables: { id } });
      await Swal.fire('Eliminado', 'Porcino eliminado correctamente.', 'success');
      qPorcinos.refetch();
    } catch (err) {
      return Swal.fire('Error', err?.message || 'No se pudo eliminar.', 'error');
    }
  }

  function onClienteSaved() { setShowClienteForm(false); qClientes.refetch(); }
  function onAlimentacionSaved() { setShowAlimentacionForm(false); qAlims.refetch(); }

  function abrirModalAlimentar(p) {
    setPorcinoSeleccionado(p);
    setAlimentarForm({ alimentacionId: '', dosis: '' });
    setAlimentarModalOpen(true);
  }
  function handleAlimentarChange(e) { setAlimentarForm({ ...alimentarForm, [e.target.name]: e.target.value }); }

  async function guardarAlimentacionEnPorcino(e) {
    e.preventDefault();
    if (!alimentarForm.alimentacionId) { Swal.fire('Error', 'Seleccione una alimentación.', 'error'); return; }
    if (!alimentarForm.dosis || Number(alimentarForm.dosis) <= 0) { Swal.fire('Error', 'Ingrese una dosis válida (libras).', 'error'); return; }

    try {
      await alimentar({
        variables: {
          input: {
            porcinoId: porcinoSeleccionado._id,
            alimentacionId: alimentarForm.alimentacionId,
            dosis: Number(alimentarForm.dosis)
          }
        }
      });
      await Swal.fire('¡Listo!', 'Alimentación registrada y stock actualizado.', 'success');
      setAlimentarModalOpen(false);
      qPorcinos.refetch();
      qAlims.refetch();
    } catch (err) {
      return Swal.fire('Error', err?.message || 'No se pudo registrar la alimentación.', 'error');
    }
  }

  function exportPorcinosPdf() {
    const columns = ['Identificación', 'Raza', 'Edad (meses)', 'Peso (kg)', 'Cliente'];
    const rows = porcinos.map(p => [
      p.identificacion,
      ['', 'York', 'Hamp', 'Duroc'][p.raza],
      p.edad,
      p.peso,
      `${p.cliente?.nombres || ''} ${p.cliente?.apellidos || ''}`.trim()
    ]);
    exportToPdf({
      title: 'Reporte de Porcinos',
      columns, rows,
      fileName: `porcinos_${new Date().toISOString().slice(0,10)}.pdf`,
      subtitle: 'Listado general',
      orientation: 'p'
    });
  }

  function exportHistorialPdf(p) {
    const columns = ['Alimento', 'Dosis (lbs)', 'Fecha'];
    const rows = (p.historialAlimentacion || []).map(h => [
      h.nombreSnapshot || 'Alimento (histórico)',
      h.dosis,
      new Date(h.fecha).toLocaleDateString()
    ]);
    exportToPdf({
      title: `Historial de Alimentaciones - ${p.identificacion}`,
      columns, rows,
      fileName: `historial_${p.identificacion}_${new Date().toISOString().slice(0,10)}.pdf`,
      orientation: 'p'
    });
  }

  function abrirHistorialModal(p) {
    setPorcinoHist(p);
    setHistModalOpen(true);
  }

  if (showClienteForm) {
    return <ClienteCRUD minimalMode onSaved={onClienteSaved} onCancel={() => setShowClienteForm(false)} />;
  }
  if (showAlimentacionForm) {
    return <AlimentacionCRUD minimalMode onSaved={onAlimentacionSaved} onCancel={() => setShowAlimentacionForm(false)} />;
  }

  return (
    <div className="container main">
      <section className="section card">
        <h2>Porcinos</h2>

        <form onSubmit={save}>
          <div className="form-row">
            <div>
              <label>Identificación</label>
              <input name="identificacion" value={form.identificacion} onChange={handleChange} placeholder="Identificación única" disabled={!!editId} />
            </div>
            <div>
              <label>Raza</label>
              <select name="raza" value={form.raza} onChange={handleChange}>
                <option value={1}>York</option>
                <option value={2}>Hamp</option>
                <option value={3}>Duroc</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Edad (meses)</label>
              <input type="number" name="edad" value={form.edad} onChange={handleChange} min="0" />
            </div>
            <div>
              <label>Peso (kg)</label>
              <input type="number" name="peso" value={form.peso} onChange={handleChange} min="0" step="0.1" />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Cliente</label>
              <select name="cliente" value={form.cliente} onChange={handleChange}>
                <option value="">Seleccione cliente</option>
                {clientes.map(c => (
                  <option key={c._id} value={c._id}>{c.nombres} {c.apellidos}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editId ? 'Actualizar' : 'Crear'}</button>
            <button className="btn btn-outline" type="button" onClick={() => { setForm({ identificacion: '', raza: 1, edad: '', peso: '', cliente: '' }); setEditId(null); }}>
              Limpiar
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setShowClienteForm(true)}>Nuevo cliente</button>
            <button className="btn btn-outline" type="button" onClick={() => setShowAlimentacionForm(true)}>Nueva alimentación</button>
            <button className="btn btn-outline" type="button" onClick={exportPorcinosPdf}>
              Exportar PDF
            </button>
          </div>
        </form>
      </section>

      <section className="section card">
        <table>
          <thead>
            <tr>
              <th>Identificación</th>
              <th>Raza</th>
              <th>Edad (meses)</th>
              <th>Peso (kg)</th>
              <th>Cliente</th>
              <th>Historial (últimos)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {porcinos.map(p => (
              <tr key={p._id}>
                <td>{p.identificacion}</td>
                <td>{['', 'York', 'Hamp', 'Duroc'][p.raza]}</td>
                <td>{p.edad}</td>
                <td>{p.peso}</td>
                <td>{p.cliente?.nombres} {p.cliente?.apellidos}</td>
                <td>
                  {Array.isArray(p.historialAlimentacion) && p.historialAlimentacion.length > 0
                    ? p.historialAlimentacion.slice(-2).map(h => (
                        <div key={`${h.nombreSnapshot}-${h.fecha}`} style={{ color:'var(--color-primary-900)' }}>
                          {h.nombreSnapshot || 'Histórico'} · {h.dosis} lbs · {new Date(h.fecha).toLocaleDateString()}
                        </div>
                      ))
                    : <span>Sin registros</span>}
                </td>
                <td>
<div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
  <button className="icon-btn primary" onClick={() => abrirModalAlimentar(p)} title="Agregar alimentación">🌾➕</button>
  <button className="icon-btn" onClick={() => edit(p)} title="Editar">✏️</button>
   <button className="btn btn-danger" onClick={() => del(p._id)} title="Eliminar porcino">🗑️</button>
  <button className="icon-btn" onClick={() => abrirHistorialModal(p)} title="Ver historial">📜</button>
 

</div>
                </td>
              </tr>
            ))}
            {porcinos.length === 0 && <tr><td colSpan="7">Sin registros</td></tr>}
          </tbody>
        </table>
      </section>

      {/* Modal: agregar alimentación */}
      <Modal isOpen={alimentarModalOpen} onRequestClose={() => setAlimentarModalOpen(false)} ariaHideApp={false}>
        <h3>Agregar alimentación a porcino</h3>
        <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
          <p><strong>Porcino:</strong> {porcinoSeleccionado?.identificacion}</p>
          <form onSubmit={guardarAlimentacionEnPorcino}>
            <div className="form-row">
              <div>
                <label>Alimentación</label>
                <select name="alimentacionId" value={alimentarForm.alimentacionId} onChange={handleAlimentarChange}>
                  <option value="">Seleccione</option>
                  {alimentaciones.map(a => (
                    <option key={a._id} value={a._id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Dosis (lbs)</label>
                <input type="number" name="dosis" value={alimentarForm.dosis} onChange={handleAlimentarChange} min="0.1" step="0.1" />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">Guardar</button>
              <button className="btn btn-outline" type="button" onClick={() => setAlimentarModalOpen(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: historial con tabla separada */}
      <Modal isOpen={histModalOpen} onRequestClose={() => setHistModalOpen(false)} ariaHideApp={false}>
        <h3>Historial de alimentaciones</h3>
        <p><strong>Porcino:</strong> {porcinoHist?.identificacion} — {porcinoHist?.cliente?.nombres} {porcinoHist?.cliente?.apellidos}</p>
        <div className="card" style={{ border:'none', boxShadow:'none', padding:0 }}>
          <table>
            <thead>
              <tr>
                <th>Alimento</th>
                <th>Dosis (lbs)</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
<tbody>
  {(porcinoHist?.historialAlimentacion || []).map(h => (
    <tr key={h._id || `${h.nombreSnapshot}-${h.fecha}`}>
      <td>{h.nombreSnapshot || 'Alimento (histórico)'}</td>
      <td>{h.dosis}</td>
      <td>{new Date(h.fecha).toLocaleDateString()}</td>
<td>
  <div style={{ display:'flex', gap:8 }}>
    {h.alimentacion?._id ? (
      <button
        className="icon-btn"
        onClick={() => abrirEditarHist(porcinoHist, h)}
        title="Editar"
      >
        ✏️
      </button>
    ) : (
      <span className="badge">No editable</span>
    )}
    <button
      className="icon-btn danger"
      onClick={() => onEliminarClick(porcinoHist._id, h._id)}
      title="Eliminar"
      disabled={!h._id}
    >
      🗑️
    </button>
  </div>
</td>
    </tr>
  ))}
  {(!porcinoHist?.historialAlimentacion || porcinoHist.historialAlimentacion.length === 0) && (
    <tr><td colSpan="4">Sin registros</td></tr>
  )}
</tbody>
          </table>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setHistModalOpen(false)}>Cerrar</button>
            <button className="btn btn-primary" onClick={() => exportHistorialPdf(porcinoHist)}>Exportar PDF</button>
          </div>
        </div>
      </Modal>

      {/* Modal editar historial existente (placeholder UI, aún sin mutations GraphQL específicas) */}
<EditarHistorialModal
  isOpen={editHistOpen}
  onRequestClose={() => setEditHistOpen(false)}
  porcino={porcinoEditRef}
  registro={registroEdit}
  onGuardado={(porcUpdated) => {
    if (porcUpdated) {
      setPorcinos((prev) => prev.map(p => (p._id === porcUpdated._id ? porcUpdated : p)));
      setPorcinoHist((curr) => (curr && curr._id === porcUpdated._id ? porcUpdated : curr));
      qAlims.refetch(); // ver stock actualizado
    } else {
      qPorcinos.refetch();
      qAlims.refetch();
    }
  }}
/>
    </div>
  );
}
