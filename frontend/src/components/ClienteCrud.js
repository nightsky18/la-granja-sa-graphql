// src/components/ClienteCRUD.js
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useClientes } from '../hooks/useClientes';
import { Q_CLIENTES } from '../graphql/cliente.gql';

export default function ClienteCRUD({ minimalMode, onSaved, onCancel }) {
  const { list, crear, actualizar, eliminar } = useClientes();
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ cedula: '', nombres: '', apellidos: '', direccion: '',  telefono: '' });
  const [editId, setEditId] = useState(null);

  // Sincronizar estado local cuando hay data
  useEffect(() => {
    if (list.data?.clientes) setClientes(list.data.clientes);
  }, [list.data?.clientes]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function capitalizar(texto = '') {
    return texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : '';
  }

  async function save(e) {
    e.preventDefault();

    // Validaciones básicas
    if (!/^\d{10}$/.test(form.telefono)) {
      return Swal.fire('Error', 'Teléfono debe tener exactamente 10 números.', 'error');
    }
    if (form.nombres.trim().length < 3 || form.apellidos.trim().length < 3) {
      return Swal.fire('Error', 'Nombre y apellido deben tener al menos 3 letras.', 'error');
    }
    if (!form.direccion.trim()) {
      return Swal.fire('Error', 'La dirección es obligatoria.', 'error');
    }

    try {
      if (editId) {
    const res = await actualizar({
  variables: {
    id: editId,
    data: {
      // enviar solo los que el usuario cambió; pueden ir todos como opcionales
      cedula: form.cedula || undefined,
      nombres: form.nombres || undefined,
      apellidos: form.apellidos || undefined,
      direccion: form.direccion || undefined,
      telefono: form.telefono || undefined,
    },
  },
  refetchQueries: [{ query: Q_CLIENTES }],
  awaitRefetchQueries: true,
  update(cache, { data }) {
    const upd = data?.actualizarCliente;
    if (!upd) return;
    const prev = cache.readQuery({ query: Q_CLIENTES }) || { clientes: [] };
    cache.writeQuery({
      query: Q_CLIENTES,
      data: { clientes: prev.clientes.map((c) => (c._id === upd._id ? upd : c)) },
    });
  },
});
        const updated = res?.data?.actualizarCliente;
        if (!updated) throw new Error('No se recibió respuesta del servidor');
      } else {
        const res = await crear({
          variables: { data: { ...form } },
          refetchQueries: [{ query: Q_CLIENTES }],
          awaitRefetchQueries: true,
          update(cache, { data }) {
            const nuevo = data?.crearCliente;
            if (!nuevo) return;
            const prev = cache.readQuery({ query: Q_CLIENTES }) || { clientes: [] };
            if (!prev.clientes.some((c) => c._id === nuevo._id)) {
              cache.writeQuery({ query: Q_CLIENTES, data: { clientes: [nuevo, ...prev.clientes] } });
            }
          },
        });
        const nuevo = res?.data?.crearCliente;
        if (!nuevo) throw new Error('No se recibió respuesta del servidor');
      }

      await Swal.fire('¡Éxito!', `Cliente ${editId ? 'actualizado' : 'creado'} correctamente`, 'success');
      setForm({ cedula: '', nombres: '', apellidos: '', direccion: '', telefono: '' });
      setEditId(null);
      onSaved?.();
    } catch (error) {
      const gerr = error?.graphQLErrors?.[0]?.message || error?.message || 'Error al guardar cliente';
      if (/duplicado|cedula|c[eé]dula/i.test(gerr)) {
        return Swal.fire('Error', 'La cédula ya está registrada.', 'error');
      }
      return Swal.fire('Error', gerr, 'error');
    }
  }

  function edit(cli) {
    setForm({
      cedula: cli.cedula || '',
      nombres: cli.nombres || '',
      apellidos: cli.apellidos || '',
      direccion: cli.direccion || '',
      telefono: cli.telefono || '',
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
      buttonsStyling: false,
    });
    if (!ok.isConfirmed) return;

    try {
      await eliminar({
        variables: { id },
        refetchQueries: [{ query: Q_CLIENTES }],
        awaitRefetchQueries: true,
        update(cache) {
          const prev = cache.readQuery({ query: Q_CLIENTES }) || { clientes: [] };
          cache.writeQuery({
            query: Q_CLIENTES,
            data: { clientes: prev.clientes.filter((c) => c._id !== id) },
          });
        },
      });
      await Swal.fire('Eliminado', 'Cliente y porcinos asociados eliminados.', 'success');
    } catch (error) {
      const msg = error?.graphQLErrors?.[0]?.message || error?.message || 'No se pudo eliminar el cliente.';
      return Swal.fire('Error', msg, 'error');
    }
  }

  // Filas a renderizar (prioriza data de Apollo, luego estado)
  const rows = list.data?.clientes ?? clientes ?? [];
console.log('ClienteCRUD render: len data', list.data?.clientes?.length, 'error?', !!list.error, list.error?.message);

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
              onClick={() => {
                setForm({ cedula: '', nombres: '', apellidos: '', direccion: '', telefono: '' });
                setEditId(null);
                onCancel?.();
              }}
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="section card">
        {/* Mensajes de estado: sólo si aún no hay filas */}
        {list.loading && rows.length === 0 && <p style={{ margin: 8 }}>Cargando...</p>}
        {list.error && rows.length === 0 && (
          <p style={{ color: 'crimson', margin: 8 }}>
            Error: {list.error.message}
          </p>
        )}

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
            {rows.length > 0 ? (
              rows.map((c) => (
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
              ))
            ) : (
              <tr><td colSpan="6">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
