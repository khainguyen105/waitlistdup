import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginForm } from './components/auth/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { CustomerPage } from './pages/CustomerPage';
import { EnhancedLocationCheckin } from './components/customer/EnhancedLocationCheckin';
import { QueueEntryPage } from './components/customer/QueueEntryPage';
import { CrossTabSync } from './components/common/CrossTabSync';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <CrossTabSync />
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginForm /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/checkin" 
            element={<CustomerPage />} 
          />
          <Route 
            path="/location/:locationId" 
            element={<EnhancedLocationCheckin />} 
          />
          <Route 
            path="/checkin/:locationId" 
            element={<EnhancedLocationCheckin />} 
          />
          <Route 
            path="/queue/:entryId" 
            element={<QueueEntryPage />} 
          />
          <Route 
            path="/checkin/:locationId" 
            element={<EnhancedLocationCheckin />} 
          />
          <Route 
            path="/" 
            element={<Navigate to="/checkin" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;