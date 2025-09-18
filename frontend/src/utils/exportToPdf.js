import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../logo.png';

/**
 * Exporta un reporte PDF con logo, título y tabla.
 * @param {Object} opts
 * @param {string} opts.title - Título del reporte.
 * @param {string[]} opts.columns - Encabezados de la tabla.
 * @param {Array<Array<string|number>>} opts.rows - Filas de la tabla (arreglo de arreglos).
 * @param {string} [opts.fileName='reporte.pdf'] - Nombre de archivo.
 * @param {string} [opts.subtitle] - Subtítulo o filtros aplicados.
 * @param {'p'|'l'} [opts.orientation='p'] - Orientación: 'p' retrato, 'l' landscape.
 * @param {string} [opts.unit='mm'] - Unidad de medida.
 * @param {string} [opts.format='a4'] - Tamaño de página.
 */
export function exportToPdf({
  title,
  columns,
  rows,
  fileName = 'reporte.pdf',
  subtitle,
  orientation = 'p',
  unit = 'mm',
  format = 'a4',
} = {}) {
  const doc = new jsPDF({ orientation, unit, format }); // A4 por defecto [1]
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo (ajusta w/h según tu asset)
  const imgW = 24, imgH = 24; // píxeles aproximados en mm
  doc.addImage(logo, 'PNG', 14, 10, imgW, imgH); // [1]

  // Título centrado
  doc.setFontSize(16);
  doc.text(title || 'Reporte', pageWidth / 2, 18, { align: 'center' });

  // Subtítulo (opcional)
  if (subtitle) {
    doc.setFontSize(11);
    doc.text(subtitle, pageWidth / 2, 24, { align: 'center' });
  }

  // Fecha lado derecho
  doc.setFontSize(10);
  const fecha = new Date().toLocaleString();
  doc.text(fecha, pageWidth - 14, 10, { align: 'right' });

  // Tabla
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 36,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [53, 89, 52] }, // verde oscuro de la paleta
    didDrawPage: (data) => {
      // Pie de página con número de página
      const page = doc.internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.text(`Página ${page}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    },
    margin: { left: 14, right: 14 },
  }); // [15][6][9]

  doc.save(fileName); // descarga el PDF [1]
}
