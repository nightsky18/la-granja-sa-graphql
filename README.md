# La Granja S.A. — Gestión Porcina

Sistema full‑stack para gestionar porcinos, clientes y alimentaciones con historial, inventario y reportes operativos, exponiendo un esquema GraphQL en el backend y consumiéndolo con Apollo Client en el frontend React. Incluye exportación a PDF con logo, paleta de marca y validaciones en ambas capas

---

## Demo
- Módulos principales:
  - CRUD de Porcinos con historial de alimentaciones y control de stock.
  - CRUD de Clientes con eliminación en cascada de porcinos asociados.
  - CRUD de Alimentaciones con stock y trazabilidad.
  - Reportes: Trazabilidad por alimento, Consumo por cliente y Consumo por alimentación, con exportación a PDF (logo, título, tablas y paginado).
- UI con tema propio (paleta verde/terracota) y header persistente con logo.

---

## Features
- Gestión completa:
  - Porcinos: alta, edición, borrado; historial de alimentaciones con snapshot de nombre/descrición para preservar trazabilidad si se elimina la alimentación original.

  - Clientes: altas con validaciones de cédula y teléfono; actualización y eliminación; asignación opcional a porcinos.

  - Alimentaciones: stock en libras, validación de no negatividad, consumo al alimentar y reembolso de stock cuando corresponde
- GraphQL:
  - Schema con queries y mutations para Porcinos, Clientes, Alimentaciones y Reportes.
  - Resolvers con validaciones, filtros por fecha/IDs y agregaciones server‑side para grandes volúmenes.
- Importación CSV:

  - Endpoint: POST /api/importar/:tipo con multipart/form-data (file). Tipos soportados: clientes, porcinos, alimentaciones.

  - Validaciones por tipo y reporte de resultados con conteo de éxitos, errores y advertencias (por ejemplo, cliente no encontrado al importar porcinos).

  - Modal en frontend con carga de archivo, mensajes guía y descarga de plantillas CSV de ejemplo.
- UX/UI:
  - Paleta de colores centralizada con CSS variables.
  - Header con logo y navegación persistente.
  - Botones compactos con iconos accesibles (➕ ✏️ 🗑️ 📜).
  - SweetAlert2 tematizado (confirmaciones, loaders).
- Reportes operativos:
  - Trazabilidad por alimento con filtro por fecha y alimento, derivado de historial.
  -Consumo por cliente con totales de libras, eventos y número de porcinos.
  - Consumo por alimentación con porcentaje respecto del total del período.
  - Exportación a PDF con jsPDF + autoTable (título, subtítulo, columnas y filas).

---

## Installation steps
Se requieren:
- Node.js LTS (v18+ recomendado)
- npm o pnpm
- MongoDB en local (o Atlas). Para transacciones, habilitar replica set (opcional).

1) Clonar repositorio
```
cd la-granja-sa-graphql
```
2) Back-end (API Express + Mongoose)
```
cd backend
```
- Variables: MONGODB_URI (por defecto mongodb://localhost:27017/la-granja), PORT=5000

```
npm install
node index.js
```
- Endpoints activos:
  - POST /graphql (Apollo v4 handler)
  - POST /api/importar/:tipo (CSV)
  - GET /health
    
3) Front-end (React)
```
cd ../frontend
npm install
npm start
```
- La app abrirá en http://localhost:3000 y consumirá la API en  http://localhost:5000/graphql .

4) Datos iniciales 
- Crear algunos Clientes, Alimentaciones y Porcinos desde la UI para probar.
- Probar importación CSV desde los modales de cada módulo.
- Ver reportes en /reports y exportar a PDF.

Descargas necesarias
- Node.js: https://nodejs.org/
- MongoDB Community Server: https://www.mongodb.com/try/download/community
- (Opcional) MongoDB Compass: https://www.mongodb.com/products/compass

---

## The process
- Diseño de datos:
  - Modelo Porcino con arreglo `historialAlimentacion` que guarda `alimentacion` (ref) y snapshot (`nombreSnapshot`, `descripcionSnapshot`) para trazabilidad aún si se elimina la alimentación original.
  - Modelos Cliente y Alimentacion con índices convenientes.
- Reglas de negocio:
  - Registrar alimentación: descuenta stock y agrega registro al historial.
  - Editar historial:  si la alimentación original ya no existe, el registro es de solo lectura.
- Reportes:
  - Calcula con datos ya cargados en memoria para periodos pequeños.
  - Exportación a PDF: jsPDF + autoTable, con logo, título/subtítulo, encabezado con color de marca y pie de página con numeración.

### Build with
- Frontend: React + Apollo Client (cache InMemory, operaciones GraphQL, modales y exportación PDF).

- Backend: Node.js + Express 5 + Apollo Server v4 (GraphQL) con resolvers para CRUD, negocio y reportes.

- Base de datos: MongoDB + Mongoose (modelos Cliente, Alimentacion, Porcino y subdocumentos de historial

  ---

### Structure
#### Raíz relevante
- backend/
  - index.js (Express 5 + Apollo Server v4 + rutas de importación CSV)
  - graphql/ (schema, resolvers)
  - models/ (Cliente, Alimentacion, Porcino)
  - routes/importarRoutes.js (importación CSV)

- frontend/
  - src/components/* (CRUDs, modales, reportes, importar CSV)
  - src/graphql/* (queries/mutations y cliente Apollo)
  - src/utils/exportToPdf.js (utilidad PDF)

---

## Useful resources
- React: crear proyecto y estructura de archivos (MDN/getting started).
- Apollo Client: configuración del cliente, cache InMemory y patrones para queries/mutations en React
- Apollo Server: definición de esquemas y resolvers, manejo de errores y mejores prácticas en Node.
- CSV en Node: carga multipart en memoria y parsing seguro de archivos para importación masiva.
- jsPDF + autoTable: generación de PDF y tablas con encabezados y estilos (exportación).
  
---

## License
Sin licencia

---

## Authors
  - Mateo Berrío Cardona
  - Mariana Montoya Sepúlveda


