import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Магазин
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/products" className="hover:text-gray-200">
              Товары
            </Link>
            
            {user?.role === 'admin' && (
              <Link to="/users" className="hover:text-gray-200">
                Пользователи
              </Link>
            )}
            
            {user && (user.role === 'seller' || user.role === 'admin') && (
              <Link to="/products/create" className="hover:text-gray-200">
                Создать товар
              </Link>
            )}
            
            {user ? (
              <>
                <span className="text-sm">
                  {user.first_name} {user.last_name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-200">
                  Вход
                </Link>
                <Link to="/register" className="hover:text-gray-200">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;