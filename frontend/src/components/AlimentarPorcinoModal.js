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

  const alimentaciones = data?.alimentaciones || [];
  const dosisValida = Number(form.dosis) > 0 && form.alimentacionId;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!dosisValida) return;
    try {
      await alimentar({
        variables: {
          input: { porcinoId, alimentacionId: form.alimentacionId, dosis: Number(form.dosis) }
        }
      });
      await refetch?.(); // opcional: actualizar stock mostrado
      onAlimentado?.();
      onRequestClose?.();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} ariaHideApp={false}>
      <h2>Agregar alimentación a porcino</h2>
      <form onSubmit={handleSubmit}>
        <select name="alimentacionId" value={form.alimentacionId} onChange={(e)=>setForm({...form, alimentacionId: e.target.value})} required>
          <option value="">Seleccione alimentación</option>
          {alimentaciones.map(a => (
            <option key={a._id} value={a._id}>{a.nombre} (Stock: {a.cantidadLibras} lbs)</option>
          ))}
        </select>

        <input type="number" name="dosis" value={form.dosis} onChange={(e)=>setForm({...form, dosis: e.target.value})} placeholder="Dosis en libras" step="0.1" min="0.1" required />

        <button type="submit" disabled={loading || !dosisValida}>{loading ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onRequestClose} disabled={loading}>Cancelar</button>
      </form>
    </Modal>
  );
}
