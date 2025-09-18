import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from '../logo.png';

export default function Header() {
  return (
    <header className="app-header">
     
      <div className="header-inner">
        <img className="logo" src={logo} alt="La Granja S.A." />
        <h1 className="brand">La Granja S.A.</h1>
        <nav className="nav">
          <Link to="/">Porcinos</Link>
          <Link to="/clientes">Clientes</Link>
          <Link to="/alimentaciones">Alimentaciones</Link>
          <Link to="/reports">Reportes</Link>
        </nav>
      </div>
    </header>
  );
}
