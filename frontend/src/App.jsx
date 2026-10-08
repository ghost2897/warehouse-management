import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Warehouses from './pages/Warehouses';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Transfers from './pages/Transfers';
import Vehicles from './pages/Vehicles';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="transfers" element={<Transfers />} />
        <Route path="transport-vehicles" element={<Vehicles />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

