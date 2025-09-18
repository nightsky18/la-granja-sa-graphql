import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const API = 'http://localhost:5000/api/clientes';

export default function ClienteCRUD({ minimalMode, onSaved, onCancel }) {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ cedula: '', nombres: '', apellidos: '', direccion: '', telefono: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { cargar(); }, []);
  function cargar() { fetch(API).then(res => res.json()).then(setClientes); }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function save(e) {
    e.preventDefault();

    // Validaciones básicas frontend
    if (!/^\d{10}$/.test(form.telefono)) {
      return Swal.fire('Error', 'Teléfono debe tener exactamente 10 números.', 'error');
    }
    if (form.nombres.trim().length < 3 || form.apellidos.trim().length < 3) {
      return Swal.fire('Error', 'Nombre y apellido deben tener al menos 3 letras.', 'error');
    }
    if (!form.direccion.trim()) {
      return Swal.fire('Error', 'La dirección es obligatoria.', 'error');
    }

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API}/${editId}` : API;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { mensaje: text }; }

      if (!res.ok) {
        if (data.mensaje && /cedula/i.test(data.mensaje)) {
          return Swal.fire('Error', 'La cédula ya está registrada.', 'error');
        }
        return Swal.fire('Error', data.mensaje || 'Error al guardar cliente', 'error');
      }

      await Swal.fire('¡Éxito!', `Cliente ${editId ? 'actualizado' : 'creado'} correctamente`, 'success');
      setForm({ cedula: '', nombres: '', apellidos: '', direccion: '', telefono: '' });
      setEditId(null);
      cargar();
      onSaved?.();
    } catch (error) {
      Swal.fire('Error', 'Error en la conexión con el servidor.', 'error');
    }
  }

  function edit(cli) {
    setForm({
      cedula: cli.cedula || '',
      nombres: cli.nombres || '',
      apellidos: cli.apellidos || '',
      direccion: cli.direccion || '',
      telefono: cli.telefono || ''
    });
    setEditId(cli._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function del(id) {
    const ok = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: 'También se eliminarán todos los porcinos asociados a este cliente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
      customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline' },
      buttonsStyling: false
    }); // customClass + buttonsStyling [4][3]
    if (!ok.isConfirmed) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const contentType = res.headers.get('Content-Type') || '';
      const isJson = contentType.includes('application/json');
      const text = await res.text();
      const data = isJson && text ? JSON.parse(text) : (text ? { mensaje: text } : {});

      if (!res.ok) {
        const msg = data?.mensaje || 'No se pudo eliminar el cliente.';
        return Swal.fire('Error', msg, 'error');
      }

      await Swal.fire('Eliminado', data?.mensaje || 'Cliente y porcinos asociados eliminados.', 'success');
      cargar();
    } catch {
      Swal.fire('Error', 'Error de conexión al eliminar cliente.', 'error');
    }
  }

  function capitalizar(texto = '') {
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

  return (
    <div className="container main">
      <section className="section card">
        <h2>Clientes</h2>

        <form onSubmit={save}>
          <div className="form-row">
            <div>
              <label>Cédula</label>
              <input name="cedula" value={form.cedula} onChange={handleChange} placeholder="Cédula" />
            </div>
            <div>
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="10 dígitos" />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Nombres</label>
              <input name="nombres" value={form.nombres} onChange={handleChange} placeholder="Nombres" />
            </div>
            <div>
              <label>Apellidos</label>
              <input name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Apellidos" />
            </div>
          </div>

          <div className="form-row">
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editId ? 'Actualizar' : 'Crear'}</button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => { setForm({ cedula: '', nombres: '', apellidos: '', direccion: '', telefono: '' }); setEditId(null); onCancel?.(); }}
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="section card">
        <table>
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c._id}>
                <td>{c.cedula}</td>
                <td>{capitalizar(c.nombres)}</td>
                <td>{capitalizar(c.apellidos)}</td>
                <td>{c.direccion}</td>
                <td>{c.telefono}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => edit(c)}>✏️</button>
                    <button className="btn btn-danger" onClick={() => del(c._id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && <tr><td colSpan="6">Sin registros</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
