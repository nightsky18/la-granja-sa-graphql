import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { useAlimentaciones } from '../hooks/useAlimentaciones';
import { usePorcinosMin } from '../hooks/usePorcinosMin';
import ImportarCSVModal from './ImportarCSVModal';

function AlimentarPorcinoInline({ alimentacion, onDone }) {
  const [isOpen, setOpen] = useState(false);
  const [form, setForm] = useState({ porcinoId: '', dosis: '' });
  const [loading, setLoading] = useState(false);
  const { porcinos, alimentar } = usePorcinosMin();

  useEffect(() => {
    if (isOpen) setForm({ porcinoId: '', dosis: '' });
  }, [isOpen]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.porcinoId) return Swal.fire('Error', 'Seleccione un porcino.', 'error');
    if (!form.dosis || Number(form.dosis) <= 0) return Swal.fire('Error', 'Ingrese una dosis válida (mayor que 0).', 'error');

    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    setLoading(true);
    try {
      await alimentar({
        variables: { input: { porcinoId: form.porcinoId, alimentacionId: alimentacion._id, dosis: Number(form.dosis) } }
      });
      Swal.close();
      await Swal.fire('¡Listo!', 'Alimentación registrada y stock actualizado.', 'success');
      setOpen(false);
      onDone?.();
    } catch (err) {
      Swal.close();
      return Swal.fire('Error', err?.message || 'Error al asignar alimentación', 'error');
    } finally {
      setLoading(false);
    }
  }

  const listaPorcinos = porcinos.data?.porcinos || [];

  return (
    <>
      <button className="btn btn-sm btn-outline-success" onClick={() => setOpen(true)}>Alimentar</button>
      <Modal isOpen={isOpen} onRequestClose={() => setOpen(false)} ariaHideApp={false} contentLabel="Alimentar porcino">
        <h5>Asignar alimentación a porcino</h5>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Porcino</label>
            <select name="porcinoId" className="form-select" value={form.porcinoId} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {listaPorcinos.map(p => <option key={p._id} value={p._id}>{p.identificacion}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label>Dosis (lbs)</label>
            <input name="dosis" type="number" min="0.1" step="0.1" className="form-control" value={form.dosis} onChange={handleChange} />
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit" disabled={loading}>Guardar</button>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function AlimentacionCrud() {
  const { list, crear, actualizar, eliminar } = useAlimentaciones();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ id: '', nombre: '', descripcion: '', cantidadLibras: 0 });
  const [editId, setEditId] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    if (list.data?.alimentaciones) setItems(list.data.alimentaciones);
  }, [list.data]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'cantidadLibras' ? Number(value) : value }));
  }

  function reset() {
    setForm({ id: '', nombre: '', descripcion: '', cantidadLibras: 0 });
    setEditId(null);
  }

  async function save(e) {
    e.preventDefault();

    // Validaciones mínimas coherentes con backend
    if (!form.nombre.trim()) return Swal.fire('Error', 'El nombre es requerido.', 'error');
    if (!editId && !form.id.trim()) return Swal.fire('Error', 'El ID es obligatorio y debe ser único.', 'error');
    if (form.cantidadLibras < 0) return Swal.fire('Error', 'El stock no puede ser negativo.', 'error');

    try {
      if (editId) {
        await actualizar({ variables: { id: editId, data: {
          nombre: form.nombre,
          descripcion: form.descripcion,
          cantidadLibras: Number(form.cantidadLibras),
        } } });
      } else {
        await crear({ variables: { data: {
          id: form.id,
          nombre: form.nombre,
          descripcion: form.descripcion,
          cantidadLibras: Number(form.cantidadLibras),
        } } });
      }
      await Swal.fire('¡Éxito!', `Alimentación ${editId ? 'actualizada' : 'creada'} correctamente`, 'success');
      reset();
    } catch (err) {
      const msg = err?.message || 'No se pudo guardar';
      return Swal.fire('Error', msg, 'error');
    }
  }

  async function del(id) {
    const ok = await Swal.fire({
      title: '¿Eliminar alimentación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!ok.isConfirmed) return;
    try {
      await eliminar({ variables: { id } });
      await Swal.fire('Eliminada', 'La alimentación fue eliminada.', 'success');
    } catch (err) {
      const msg = err?.message || 'No se pudo eliminar';
      return Swal.fire('Error', msg, 'error');
    }
  }

  function edit(a) {
    setForm({ id: a.id, nombre: a.nombre || '', descripcion: a.descripcion || '', cantidadLibras: a.cantidadLibras ?? 0 });
    setEditId(a._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="container main">
      <section className="section card">
        <h2>Alimentaciones</h2>

        <form onSubmit={save}>
          <div className="form-row">
            {!editId && (
              <div>
                <label>ID</label>
                <input name="id" value={form.id} onChange={handleChange} placeholder="Ej: ALIM-001" required />
              </div>
            )}
            <div>
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del alimento" required />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Descripción</label>
              <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción breve" />
            </div>
            <div>
              <label>Cantidad (lbs)</label>
              <input type="number" name="cantidadLibras" value={form.cantidadLibras} onChange={handleChange} min="0" step="0.1" />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editId ? 'Actualizar' : 'Crear'}</button>
            <button className="btn btn-outline" type="button" onClick={reset}>
              Limpiar
            </button>
            <button 
              className="btn btn-outline" 
              type="button" 
              onClick={() => setImportModalOpen(true)}
            >
              📥 Importar desde CSV
            </button>

            <ImportarCSVModal
              isOpen={importModalOpen}
              onRequestClose={() => setImportModalOpen(false)}
              tipo="alimentaciones"
              onImportSuccess={() => {
                list.refetch();
              }}
            />
          </div>
        </form>
      </section>

      <section className="section card">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Descripción</th><th>Stock (lbs)</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a._id}>
                <td>{a.id}</td>
                <td>{a.nombre}</td>
                <td>{a.descripcion || '-'}</td>
                <td>{a.cantidadLibras}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => edit(a)}>✏️</button>
                    <button className="btn btn-danger" onClick={() => del(a._id)}>🗑️</button>
                    <AlimentarPorcinoInline alimentacion={a} onDone={() => list.refetch()} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan="5">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
