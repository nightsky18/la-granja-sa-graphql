import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { useEditarHistorial } from '../hooks/useEditarHistorial';

export default function EditarHistorialModal({ isOpen, onRequestClose, porcino, registro, onGuardado }) {
  const { alimentaciones, editar } = useEditarHistorial();
  const [form, setForm] = useState({ alimentacionId: '', dosis: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && registro) {
      setForm({
        alimentacionId: registro?.alimentacion?._id || '',
        dosis: registro?.dosis || ''
      });
    }
  }, [isOpen, registro]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function save(e) {
    e.preventDefault();

    if (!porcino?._id || !registro?._id) {
      return Swal.fire('Error', 'No se encontró el porcino o el registro a editar.', 'error');
    }
    if (!form.alimentacionId) {
      return Swal.fire('Error', 'Seleccione alimentación.', 'error');
    }
    if (!form.dosis || Number(form.dosis) <= 0) {
      return Swal.fire('Error', 'Dosis debe ser mayor que 0.', 'error');
    }

    setLoading(true);
    try {
      await editar({
        variables: {
          input: {
            porcinoId: porcino._id,
            historialId: registro._id,
            alimentacionId: form.alimentacionId,
            dosis: Number(form.dosis),
          }
        }
      });
      await Swal.fire('Listo', 'Historial actualizado.', 'success');
      onGuardado?.();
      onRequestClose?.();
    } catch (err) {
      return Swal.fire('Error', err?.message || 'No se pudo actualizar el historial.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const existeAlim = Boolean(registro?.alimentacion?._id);
  const alims = alimentaciones.data?.alimentaciones || [];

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} ariaHideApp={false}>
      {existeAlim ? (
        <>
          <h3>Editar registro de alimentación</h3>
          <form onSubmit={save}>
            <select name="alimentacionId" value={form.alimentacionId} onChange={handleChange} required>
              <option value="">Seleccione alimentación</option>
              {alims.map(a => (
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
          <p>Dosis: <strong>{registro?.dosis}</strong> lbs</p>
          <p>Fecha: <strong>{registro?.fecha ? new Date(registro.fecha).toLocaleDateString() : '-'}</strong></p>
          <button type="button" onClick={onRequestClose}>Cerrar</button>
        </>
      )}
    </Modal>
  );
}
