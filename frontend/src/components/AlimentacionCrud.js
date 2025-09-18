import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';

const API = 'http://localhost:5000/api/alimentaciones';

function AlimentarPorcinoInline({ alimentacion, onDone }) {
  const [isOpen, setOpen] = useState(false);
  const [porcinos, setPorcinos] = useState([]);
  const [form, setForm] = useState({ porcinoId: '', dosis: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:5000/api/porcinos')
        .then(r => r.json())
        .then(setPorcinos)
        .catch(() => setPorcinos([]));
      setForm({ porcinoId: '', dosis: '' });
    }
  }, [isOpen]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.porcinoId) {
      return Swal.fire('Error', 'Seleccione un porcino.', 'error');
    }
    if (!form.dosis || Number(form.dosis) <= 0) {
      return Swal.fire('Error', 'Ingrese una dosis válida (mayor que 0).', 'error');
    }

    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: 'card' },
      buttonsStyling: false
    }); // loader [15]

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/porcinos/${form.porcinoId}/alimentar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alimentacionId: alimentacion._id, dosis: Number(form.dosis) })
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { mensaje: text }; }
      Swal.close();

      if (!res.ok) {
        const msg = data?.mensaje || 'Error al asignar alimentación';
        return Swal.fire('Error', msg, 'error');
      }

      await Swal.fire('¡Listo!', 'Alimentación registrada y stock actualizado.', 'success');
      setOpen(false);
      onDone?.();
    } catch {
      Swal.close();
      Swal.fire('Error', 'Error en la conexión al servidor.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)}>🐷➕</button>
      <Modal isOpen={isOpen} onRequestClose={() => setOpen(false)} ariaHideApp={false}>
        <h3>Asignar alimentación a porcino</h3>
        <form onSubmit={handleSubmit} className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
          <div className="form-row">
            <div>
              <label>Porcino</label>
              <select name="porcinoId" value={form.porcinoId} onChange={handleChange} required>
                <option value="">Seleccione</option>
                {porcinos.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.identificacion} - {p.cliente?.nombres} {p.cliente?.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Dosis (lbs)</label>
              <input type="number" name="dosis" value={form.dosis} onChange={handleChange} min="0.1" step="0.1" required />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function AlimentacionCRUD() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ id: '', nombre: '', descripcion: '', cantidadLibras: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { cargar(); }, []);
  function cargar() { fetch(API).then(r => r.json()).then(setList); }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function validar() {
    if (!form.id?.trim()) return Swal.fire('Error', 'El ID es obligatorio y debe ser único.', 'error'), false;
    if (!form.nombre?.trim()) return Swal.fire('Error', 'El nombre es obligatorio.', 'error'), false;
    if (!form.descripcion?.trim()) return Swal.fire('Error', 'La descripción es obligatoria.', 'error'), false;
    if (!form.cantidadLibras || Number(form.cantidadLibras) <= 0)
      return Swal.fire('Error', 'La cantidad en libras debe ser un número positivo.', 'error'), false;
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (!validar()) return;

    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), buttonsStyling: false });

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API}/${editId}` : API;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          cantidadLibras: Number(form.cantidadLibras)
        })
      });

      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { mensaje: text }; }

      Swal.close();

      if (!res.ok) {
        const isDuplicate = res.status === 400 && (
          /id.*(ya )?existe/i.test(data?.mensaje || '') ||
          /duplicate key/i.test(data?.mensaje || '') ||
          data?.code === 11000
        );
        if (isDuplicate) {
          return Swal.fire('ID duplicado', 'El ID de alimentación ya está registrado en el sistema.', 'error');
        }
        return Swal.fire('Error', data?.mensaje || 'No se pudo guardar la alimentación.', 'error');
      }

      await Swal.fire('Éxito', editId ? 'Alimentación actualizada correctamente.' : 'Alimentación creada correctamente.', 'success');

      setForm({ id: '', nombre: '', descripcion: '', cantidadLibras: '' });
      setEditId(null);
      cargar();
    } catch {
      Swal.close();
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    }
  }

  

  async function del(id) {
    const ok = await Swal.fire({
      title: '¿Eliminar alimentación?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline' },
      buttonsStyling: false
    }); // customClass + buttonsStyling [13][15]
    if (!ok.isConfirmed) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const contentType = res.headers.get('Content-Type') || '';
      const isJson = contentType.includes('application/json');
      const text = await res.text();
      const data = isJson && text ? JSON.parse(text) : (text ? { mensaje: text } : {});

      if (!res.ok) {
        return Swal.fire('Error', data?.mensaje || 'No se pudo eliminar la alimentación.', 'error');
      }

      Swal.fire('Eliminado', 'Alimentación eliminada correctamente.', 'success');
      cargar();
    } catch {
      Swal.fire('Error', 'Error de conexión al eliminar.', 'error');
    }
  }

  function edit(a) {
    setForm({ id: a.id, nombre: a.nombre, descripcion: a.descripcion, cantidadLibras: a.cantidadLibras });
    setEditId(a._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="container main">
      <section className="section card">
        <h2>Alimentaciones</h2>

        <form onSubmit={save}>
          <div className="form-row">
            <div>
              <label>ID</label>
              <input name="id" value={form.id} onChange={handleChange} placeholder="Ej: ALIM-001" />
            </div>
            <div>
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del alimento" />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Descripción</label>
              <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción breve" />
            </div>
            <div>
              <label>Cantidad (lbs)</label>
              <input type="number" name="cantidadLibras" value={form.cantidadLibras} onChange={handleChange} min="0.1" step="0.1" />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editId ? 'Actualizar' : 'Crear'}</button>
            <button className="btn btn-outline" type="button" onClick={() => { setForm({ id: '', nombre: '', descripcion: '', cantidadLibras: '' }); setEditId(null); }}>
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="section card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Stock (lbs)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map(a => (
              <tr key={a._id}>
                <td>{a.id}</td>
                <td>{a.nombre}</td>
                <td>{a.descripcion}</td>
                <td>{a.cantidadLibras}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => edit(a)}>✏️</button>
                    <button className="btn btn-danger" onClick={() => del(a._id)}>🗑️</button>
                    <AlimentarPorcinoInline alimentacion={a} onDone={cargar} />
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="5">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
