/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Client/Home';
import { FlowerDetail } from './pages/Client/FlowerDetail';
import { CustomerProfile } from './pages/Client/Profile';
import { Dashboard } from './pages/Admin/Dashboard';
import { Orders } from './pages/Staff/Orders';
import { Deliveries } from './pages/Shipper/Deliveries';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="flower/:id" element={<FlowerDetail />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="admin" element={<Dashboard />} />
        <Route path="staff" element={<Orders />} />
        <Route path="shipper" element={<Deliveries />} />
      </Route>
    </Routes>
  );
}
