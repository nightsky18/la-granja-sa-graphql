// frontendsrc/components/EditarHistorialModal.js
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { useEditarHistorial } from '../hooks/useEditarHistorial';

export default function EditarHistorialModal({ isOpen, onRequestClose, porcino, registro, onGuardado }) {
  const { alimentaciones, editar } = useEditarHistorial(); // usa queries/mutations GraphQL [attached_file:1]
  const [form, setForm] = useState({ alimentacionId: '', dosis: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && registro) {
      setForm({
        alimentacionId: registro?.alimentacion?._id || '',
        dosis: registro?.dosis ?? '',
      });
    }
  }, [isOpen, registro]); // [attached_file:1]

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function save(e) {
    e.preventDefault();
    // Si el registro es de solo lectura, no intentar guardar
    const existeAlim = Boolean(registro?.alimentacion?._id);
    if (!existeAlim) {
      return Swal.fire('Aviso', 'Este registro es de solo lectura porque la alimentación original fue eliminada.', 'info'); // [attached_file:1]
    }
    if (!porcino?._id || !registro?._id) {
      return Swal.fire('Error', 'No se encontró el porcino o el registro a editar.', 'error'); // [attached_file:1]
    }
    if (!form.alimentacionId) {
      return Swal.fire('Error', 'Seleccione alimentación.', 'error'); // [attached_file:1]
    }
    const dosisNum = Number(form.dosis);
    if (!dosisNum || dosisNum <= 0) {
      return Swal.fire('Error', 'Dosis debe ser mayor que 0.', 'error'); // [attached_file:1]
    }

    setLoading(true);
    try {
      await editar({
        variables: {
          porcinoId: porcino._id,
          historialId: registro._id,
          data: {
            alimentacionId: String(form.alimentacionId),
            dosis: dosisNum,
            // fecha: new Date(form.fecha).toISOString(),
          },
        },
      });
      await Swal.fire('Listo', 'Historial actualizado.', 'success'); // [attached_file:1]
      onGuardado?.(); // refetch en padre si aplica [attached_file:1]
      onRequestClose?.();
    } catch (err) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo actualizar el historial.'; // [attached_file:1]
      // Errores esperados desde resolvers: solo lectura, stock insuficiente, alimentacion no encontrada
      return Swal.fire('Error', msg, 'error'); // [attached_file:1]
    } finally {
      setLoading(false);
    }
  }

  const existeAlim = Boolean(registro?.alimentacion?._id);
  const alims = alimentaciones.data?.alimentaciones || []; // lista GraphQL [attached_file:1]

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} ariaHideApp={false}>
      {existeAlim ? (
        <>
          <h3>Editar registro de alimentación</h3>
          <form onSubmit={save}>
            <select
              name="alimentacionId"
              value={form.alimentacionId}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Seleccione alimentación</option>
              {alims.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="dosis"
              value={form.dosis}
              onChange={handleChange}
              placeholder="Dosis (lbs)"
              min="0.1"
              step="0.1"
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={onRequestClose} disabled={loading}>
              Cancelar
            </button>
          </form>
        </>
      ) : (
        <>
          <h3>Registro no editable</h3>
          <p>
            La alimentación original fue eliminada. Se conserva el nombre histórico:{' '}
            <strong>{registro?.nombreSnapshot || 'Alimento (histórico)'}</strong>.
          </p>
          <p>
            Dosis: <strong>{registro?.dosis}</strong> lbs
          </p>
          <p>
            Fecha:{' '}
            <strong>
              {registro?.fecha ? new Date(registro.fecha).toLocaleDateString() : '-'}
            </strong>
          </p>
          <button type="button" onClick={onRequestClose}>Cerrar</button>
        </>
      )}
    </Modal>
  );
}
