import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import Users from './pages/Users';
import UserEdit from './pages/UserEdit';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
  }

  return (
    <Router>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/products" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/products" />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route 
            path="/products/create" 
            element={
              <PrivateRoute allowedRoles={['seller', 'admin']}>
                <ProductForm />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/products/edit/:id" 
            element={
              <PrivateRoute allowedRoles={['seller', 'admin']}>
                <ProductForm />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Users />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/users/edit/:id" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserEdit />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/products" />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;