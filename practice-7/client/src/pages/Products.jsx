import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Ошибка удаления товара');
    }
  };

  if (loading) return <div className="text-center">Загрузка...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Товары</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition flex flex-col h-full">
            {/* Контейнер для фото с фиксированным соотношением сторон */}
            <div className="relative w-full pt-[75%] bg-gray-100 overflow-hidden">
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'} 
                alt={product.title}
                className="absolute top-0 left-0 w-full h-full object-cover hover:scale-110 transition duration-300"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                }}
              />
            </div>
            
            <div className="p-4 flex flex-col flex-grow">
              <h2 className="text-lg font-semibold mb-2 line-clamp-1">{product.title}</h2>
              <p className="text-gray-600 text-sm mb-2">{product.category}</p>
              <p className="text-gray-700 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
              <p className="text-xl font-bold text-blue-600 mb-4">{product.price.toLocaleString()} ₽</p>
              
              <div className="flex space-x-2 mt-auto">
                <Link
                  to={`/products/${product.id}`}
                  className="flex-1 bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600 transition text-sm"
                >
                  Подробнее
                </Link>
                
                {(user?.role === 'seller' || user?.role === 'admin') && (
                  <>
                    <Link
                      to={`/products/edit/${product.id}`}
                      className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 transition text-sm"
                    >
                      Изм
                    </Link>
                    
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition text-sm"
                      >
                        Уд
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Нет товаров
        </div>
      )}
    </div>
  );
}

export default Products;