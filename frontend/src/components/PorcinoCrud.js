import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { exportToPdf } from '../utils/exportToPdf';
import ClienteCRUD from './ClienteCrud';
import AlimentacionCRUD from './AlimentacionCrud';
import EditarHistorialModal from './EditarHistorialModal';

const API = 'http://localhost:5000/api/porcinos';
const API_CLIENTES = 'http://localhost:5000/api/clientes';
const API_ALIMENTACIONES = 'http://localhost:5000/api/alimentaciones';

export default function PorcinoCRUD() {
  const [porcinos, setPorcinos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [alimentaciones, setAlimentaciones] = useState([]);

  // estados
  const [editHistOpen, setEditHistOpen] = useState(false);
  const [registroEdit, setRegistroEdit] = useState(null);
  const [porcinoEditRef, setPorcinoEditRef] = useState(null);

  // form porcino
  const [form, setForm] = useState({ identificacion: '', raza: 1, edad: '', peso: '', cliente: '' });
  const [editId, setEditId] = useState(null);

  // embebidos
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [showAlimentacionForm, setShowAlimentacionForm] = useState(false);

  // alimentar
  const [alimentarModalOpen, setAlimentarModalOpen] = useState(false);
  const [porcinoSeleccionado, setPorcinoSeleccionado] = useState(null);
  const [alimentarForm, setAlimentarForm] = useState({ alimentacionId: '', dosis: '' });

  // historial modal
  const [histModalOpen, setHistModalOpen] = useState(false);
  const [porcinoHist, setPorcinoHist] = useState(null);

  useEffect(() => { cargarListas(); }, []);

  function cargarListas() {
    fetch(API).then(r => r.json()).then(setPorcinos);
    fetch(API_CLIENTES).then(r => r.json()).then(setClientes);
    fetch(API_ALIMENTACIONES).then(r => r.json()).then(setAlimentaciones);
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function validarFormulario() {
    if (!form.identificacion.trim()) { Swal.fire('Error', 'La identificación es obligatoria.', 'error'); return false; }
    if (!form.edad || Number(form.edad) <= 0) { Swal.fire('Error', 'La edad debe ser un número positivo en meses.', 'error'); return false; }
    if (!form.peso || Number(form.peso) <= 0) { Swal.fire('Error', 'El peso debe ser un número positivo en kg.', 'error'); return false; }
    if (!form.cliente) { Swal.fire('Error', 'Debe seleccionar un cliente.', 'error'); return false; }
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (!validarFormulario()) return;

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API}/${editId}` : API;

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { mensaje: text }; }

      if (!res.ok) {
        if (data?.mensaje?.toLowerCase().includes('identificacion') || data?.code === 11000) {
          Swal.fire('Error', 'La identificación ya está registrada.', 'error');
        } else {
          Swal.fire('Error', data.mensaje || 'Error al guardar porcino.', 'error');
        }
        return;
      }

      Swal.fire('¡Éxito!', editId ? 'Porcino actualizado.' : 'Porcino creado.', 'success');
      setForm({ identificacion: '', raza: 1, edad: '', peso: '', cliente: '' });
      setEditId(null);
      cargarListas();
    } catch {
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    }
  }

  function edit(p) {
    setForm({ identificacion: p.identificacion, raza: p.raza, edad: p.edad, peso: p.peso, cliente: p.cliente?._id || '' });
    setEditId(p._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirEditarHist(p, reg) {
    setPorcinoEditRef(p);
    setRegistroEdit(reg);
    setEditHistOpen(true);
  }

  async function eliminarRegistroHist(p, reg) {
    const ok = await Swal.fire({
      title: '¿Eliminar registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline' },
      buttonsStyling: false
    }); // icon buttons themed [20][21]
    if (!ok.isConfirmed) return;

    if (!p?._id) return Swal.fire('Error', 'ID de porcino no válido.', 'error');
    if (!reg?._id) return Swal.fire('Error', 'ID del registro de historial no válido.', 'error');

    const url = `http://localhost:5000/api/porcinos/${p._id}/historial/${reg._id}`;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      const contentType = res.headers.get('Content-Type') || '';
      const isJson = contentType.includes('application/json');
      const text = await res.text();
      const data = isJson && text ? JSON.parse(text) : (text ? { mensaje: text } : {});
      if (!res.ok) {
        const msg = data?.mensaje || `No se pudo eliminar. Código ${res.status}`;
        return Swal.fire('Error', msg, 'error');
      }
      await Swal.fire('Eliminado', 'Registro eliminado y stock devuelto (si aplicaba).', 'success');
      cargarListas();
      // si el modal de historial está abierto, refrescar referencia
      if (histModalOpen && porcinoHist?._id === p._id) {
        const actualizado = await fetch(`${API}`).then(r => r.json()).then(arr => arr.find(x => x._id === p._id));
        if (actualizado) setPorcinoHist(actualizado);
      }
    } catch {
      Swal.fire('Error', 'Error de conexión o URL inválida.', 'error');
    }
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
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        Swal.fire('Error', data.mensaje || 'No se pudo eliminar.', 'error');
        return;
      }
      Swal.fire('Eliminado', 'Porcino eliminado correctamente.', 'success');
      cargarListas();
    } catch {
      Swal.fire('Error', 'Error de conexión al eliminar.', 'error');
    }
  }

  function onClienteSaved() { setShowClienteForm(false); cargarListas(); }
  function onAlimentacionSaved() { setShowAlimentacionForm(false); cargarListas(); }

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
      const res = await fetch(`http://localhost:5000/api/porcinos/${porcinoSeleccionado._id}/alimentar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alimentacionId: alimentarForm.alimentacionId, dosis: Number(alimentarForm.dosis) })
      });
      const data = await res.json();
      if (!res.ok) {
        Swal.fire('Error', data.mensaje || 'No se pudo registrar la alimentación.', 'error');
        return;
      }
      Swal.fire('¡Listo!', 'Alimentación registrada y stock actualizado.', 'success');
      setAlimentarModalOpen(false);
      cargarListas();
    } catch {
      Swal.fire('Error', 'Error de conexión al registrar alimentación.', 'error');
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
  const rows = (p.historialAlimentacion || []).map(h => {
    const nombre = h.alimentacion?._id ? h.alimentacion?.nombre : (h.nombreSnapshot || 'Alimento (histórico)');
    return [nombre, h.dosis, new Date(h.fecha).toLocaleDateString()];
  });
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
              <input name="identificacion" value={form.identificacion} onChange={handleChange} placeholder="Identificación única" />
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
                    ? p.historialAlimentacion.slice(-2).map(h => {
                        const existeAlim = Boolean(h.alimentacion?._id);
                        const nombre = existeAlim ? h.alimentacion?.nombre : (h.nombreSnapshot || 'Histórico');
                        return (
                          <div key={h._id} style={{ color:'var(--color-primary-900)' }}>
                            {nombre} · {h.dosis} lbs · {new Date(h.fecha).toLocaleDateString()}
                          </div>
                        );
                      })
                    : <span>Sin registros</span>}
                </td>
                <td>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button className="icon-btn primary" onClick={() => abrirModalAlimentar(p)} aria-label="Agregar alimentación" title="Agregar alimentación">🌾➕</button>
                    <button className="icon-btn" onClick={() => edit(p)} aria-label="Editar porcino" title="Editar">✏️</button>
                    <button className="icon-btn danger" onClick={() => del(p._id)} aria-label="Eliminar porcino" title="Borrar">🗑️</button>
                    <button className="icon-btn" onClick={() => abrirHistorialModal(p)} aria-label="Ver historial" title="Ver historial">📜</button>
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
                    <option key={a._id} value={a._id}>{a.nombre} (Stock: {a.cantidadLibras} lbs)</option>
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
              {(porcinoHist?.historialAlimentacion || []).map(h => {
                const existeAlim = Boolean(h.alimentacion?._id);
                const nombre = existeAlim ? h.alimentacion?.nombre : (h.nombreSnapshot || 'Alimento (histórico)');
                return (
                  <tr key={h._id}>
                    <td>
                      {nombre}
                      {!existeAlim && <span className="badge badge-accent" style={{ marginLeft:8 }}>No editable</span>}
                    </td>
                    <td>{h.dosis}</td>
                    <td>{new Date(h.fecha).toLocaleDateString()}</td>
                    <td>
                      {existeAlim ? (
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="icon-btn" onClick={() => abrirEditarHist(porcinoHist, h)} aria-label="Editar" title="Editar">✏️</button>
                          <button className="icon-btn danger" onClick={() => eliminarRegistroHist(porcinoHist, h)} aria-label="Eliminar" title="Eliminar">🗑️</button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="icon-btn danger" onClick={() => eliminarRegistroHist(porcinoHist, h)} aria-label="Quitar" title="Quitar registro">🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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

      {/* Modal editar historial existente */}
      <EditarHistorialModal
        isOpen={editHistOpen}
        onRequestClose={() => setEditHistOpen(false)}
        porcino={porcinoEditRef}
        registro={registroEdit}
        onGuardado={cargarListas}
      />
    </div>
  );
}
