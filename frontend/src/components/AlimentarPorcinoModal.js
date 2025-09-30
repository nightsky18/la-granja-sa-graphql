import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useQuery, useMutation, gql } from '@apollo/client';

const Q_ALIMENTACIONES = gql`
  query Alimentaciones {
    alimentaciones { _id nombre cantidadLibras }
  }
`;

const M_ALIMENTAR_PORCINO = gql`
  mutation AlimentarPorcino($input: AlimentarPorcinoInput!) {
    alimentarPorcino(input: $input) {
      _id
      identificacion
      historialAlimentacion { dosis fecha nombreSnapshot }
    }
  }
`;

export default function AlimentarPorcinoModal({ isOpen, onRequestClose, porcinoId, onAlimentado }) {
  const { data, refetch } = useQuery(Q_ALIMENTACIONES, { skip: !isOpen, fetchPolicy: 'cache-and-network' });
  const [alimentar] = useMutation(M_ALIMENTAR_PORCINO);
  const [form, setForm] = useState({ alimentacionId: '', dosis: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refetch?.();
      setForm({ alimentacionId: '', dosis: '' });
    }
  }, [isOpen, refetch]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.alimentacionId) return alert('Seleccione una alimentación');
    if (!form.dosis || Number(form.dosis) <= 0) return alert('Ingrese una dosis válida (mayor que 0)');

    setLoading(true);
    try {
      await alimentar({
        variables: {
          input: {
            porcinoId,
            alimentacionId: form.alimentacionId,
            dosis: Number(form.dosis),
          },
        },
      });
      alert('Alimentación registrada correctamente');
      onAlimentado?.();
      onRequestClose?.();
    } catch (e) {
      alert(e?.message || 'Error al registrar alimentación');
    } finally {
      setLoading(false);
    }
  }

  const alimentaciones = data?.alimentaciones || [];

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} ariaHideApp={false}>
      <h2>Agregar alimentación a porcino</h2>
      <form onSubmit={handleSubmit}>
        <select
          name="alimentacionId"
          value={form.alimentacionId}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione alimentación</option>
          {alimentaciones.map(a => (
            <option key={a._id} value={a._id}>
              {a.nombre} (Stock: {a.cantidadLibras} lbs)
            </option>
          ))}
        </select>

        <input
          type="number"
          name="dosis"
          value={form.dosis}
          onChange={handleChange}
          placeholder="Dosis en libras"
          step="0.1"
          min="0.1"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onRequestClose} disabled={loading}>
          Cancelar
        </button>
      </form>
    </Modal>
  );
}
