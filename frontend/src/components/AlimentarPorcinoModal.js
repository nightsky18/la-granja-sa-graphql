import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

const API_ALIMENTACIONES = "http://localhost:5000/api/alimentaciones";

export default function AlimentarPorcinoModal({ isOpen, onRequestClose, porcinoId, onAlimentado }) {
  const [alimentaciones, setAlimentaciones] = useState([]);
  const [form, setForm] = useState({ alimentacionId: '', dosis: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch(API_ALIMENTACIONES)
        .then(res => res.json())
        .then(data => setAlimentaciones(data))
        .catch(() => setAlimentaciones([]));
      setForm({ alimentacionId: '', dosis: '' });
    }
  }, [isOpen]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.alimentacionId) {
      alert('Seleccione una alimentación');
      return;
    }
    if (!form.dosis || Number(form.dosis) <= 0) {
      alert('Ingrese una dosis válida (mayor que 0)');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/porcinos/${porcinoId}/alimentar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alimentacionId: form.alimentacionId, dosis: Number(form.dosis) })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.mensaje || 'Error al registrar alimentación');
      } else {
        alert('Alimentación registrada correctamente');
        onAlimentado();
        onRequestClose();
      }
    } catch {
      alert('Error en la conexión al servidor');
    }
    setLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} ariaHideApp={false}>
      <h2>Agregar alimentación a porcino</h2>
      <form onSubmit={handleSubmit}>
        <select name="alimentacionId" value={form.alimentacionId} onChange={handleChange} required>
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
        <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onRequestClose} disabled={loading}>Cancelar</button>
      </form>
    </Modal>
  );
}
