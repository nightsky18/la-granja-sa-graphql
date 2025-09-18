import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import ClienteCRUD from './components/ClienteCrud';
import AlimentacionCRUD from './components/AlimentacionCrud';
import PorcinoCRUD from './components/PorcinoCrud';
import Reportes from './pages/Reportes';
function App() {
  return (
    <Router>
      <Header />  {/* aparece en todas las vistas */}
      <Routes>
        <Route path="/" element={<PorcinoCRUD />} />
        <Route path="/clientes" element={<ClienteCRUD />} />
        <Route path="/alimentaciones" element={<AlimentacionCRUD />} />
        <Route path="/reports" element={<Reportes />} />
      </Routes>
    </Router>
  );
}

export default App;
