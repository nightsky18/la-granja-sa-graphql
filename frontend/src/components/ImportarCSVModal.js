import React, { useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';

export default function ImportarCSVModal({ 
  isOpen, 
  onRequestClose, 
  tipo,
  onImportSuccess 
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const mensajesPrevios = {
    porcinos: '📋 Nota: La columna "clienteCedula" es opcional. Si se deja vacía o el cliente no existe, el porcino se importará sin cliente asignado.',
    clientes: 'Asegúrese de que el archivo CSV tenga las columnas: cedula, nombres, apellidos, telefono, direccion',
    alimentaciones: 'Asegúrese de que el archivo CSV tenga las columnas: id, nombre, descripcion, cantidadLibras'
};

  const plantillas = {
    porcinos: 'identificacion,raza,edad,peso,clienteCedula\nPO001,1,12,150,1234567890\nPO002,2,8,120,1234567890\nPO003,3,6,100,\nPO004,1,10,140,',
    clientes: 'cedula,nombres,apellidos,telefono,direccion\n1234567890,Juan,Pérez,3001234567,Calle 123',
    alimentaciones: 'id,nombre,descripcion,cantidadLibras\nAL001,Concentrado Premium,Alimento balanceado,500'
  };

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      Swal.fire('Error', 'Solo se permiten archivos .csv', 'error');
      e.target.value = '';
    }
  }

  function descargarPlantilla() {
    const contenido = plantillas[tipo];
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_${tipo}.csv`;
    link.click();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!file) {
      return Swal.fire('Error', 'Seleccione un archivo CSV', 'error');
    }

    // Mostrar advertencia especial para porcinos
    if (tipo === 'porcinos') {
      const confirmar = await Swal.fire({
        title: 'Verificación de Clientes',
        text: mensajesPrevios.porcinos,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continuar importación',
        cancelButtonText: 'Cancelar'
      });
      
      if (!confirmar.isConfirmed) return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log(`Enviando archivo a: http://localhost:5000/api/importar/${tipo}`);
      
      const response = await fetch(`http://localhost:5000/api/importar/${tipo}`, {
        method: 'POST',
        body: formData,
      });

      console.log('Respuesta recibida:', response.status);
      
      const result = await response.json();
      console.log('Datos de respuesta:', result);

      if (!response.ok) {
        throw new Error(result.mensaje || 'Error al importar');
      }

      // Mostrar resumen de importación
        const { exitosos, errores, detalleErrores, advertencias } = result;

        let mensaje = `✅ Importados: ${exitosos}`;

        // Mostrar advertencias (no son errores graves)
        if (advertencias && advertencias.length > 0) {
        mensaje += `\n\n⚠️ Advertencias (${advertencias.length}):\n`;
        advertencias.slice(0, 3).forEach(a => {
            mensaje += `• ${a}\n`;
        });
        if (advertencias.length > 3) {
            mensaje += `... y ${advertencias.length - 3} advertencias más`;
        }
        }

        // Mostrar errores que impidieron importación
        if (errores > 0) {
        mensaje += `\n\n❌ Omitidos por errores: ${errores}`;
        if (detalleErrores && detalleErrores.length > 0) {
            mensaje += '\n\nErrores encontrados:\n';
            detalleErrores.slice(0, 3).forEach(e => {
            mensaje += `• ${e}\n`;
            });
            if (detalleErrores.length > 3) {
            mensaje += `... y ${detalleErrores.length - 3} errores más`;
            }
        }
        }

        await Swal.fire({
        title: exitosos > 0 ? '¡Importación completada!' : 'Importación con errores',
        text: mensaje,
        icon: exitosos > 0 ? (advertencias && advertencias.length > 0 ? 'warning' : 'success') : 'error',
        confirmButtonText: 'Aceptar'
        });


      if (exitosos > 0) {
        onImportSuccess?.();
        onRequestClose();
        setFile(null);
      }

    } catch (error) {
      console.error('Error en importación:', error);
      Swal.fire('Error', error.message || 'No se pudo completar la importación', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      ariaHideApp={false}
      style={{
        content: {
          maxWidth: '600px',
          margin: 'auto',
          maxHeight: '80vh',
          padding: '2rem'
        }
      }}
    >
      <h3>Importar {tipo} desde CSV</h3>
      
      <div style={{ 
        marginBottom: '1rem', 
        padding: '0.75rem', 
        backgroundColor: '#e7f3ff', 
        border: '1px solid #b3d9ff', 
        borderRadius: '4px' 
      }}>
        <strong>📝 Nota:</strong> Puede exportar desde Excel usando "Guardar como" → "CSV (delimitado por comas)"
      </div>

      {tipo === 'porcinos' && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffc107', 
          borderRadius: '4px' 
        }}>
          <strong>⚠️ Importante:</strong> Verifique antes de importar que los clientes propietarios de los porcinos existan en la pestaña "Clientes"
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Seleccionar archivo CSV:</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'block', marginTop: '0.5rem', width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={descargarPlantilla}
            style={{ width: '100%' }}
          >
            📥 Descargar plantilla CSV de ejemplo
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || !file}
            style={{ flex: 1 }}
          >
            {loading ? 'Importando...' : 'Importar desde CSV'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onRequestClose}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}