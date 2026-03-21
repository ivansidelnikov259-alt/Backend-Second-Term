import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError('Товар не найден');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      navigate('/products');
    } catch (err) {
      alert('Ошибка удаления товара');
    }
  };

  if (loading) return <div className="text-center">Загрузка...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!product) return <div className="text-center">Товар не найден</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Левая колонка - фото */}
        <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md mx-auto">
            <div className="relative pt-[100%]">
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/600x600?text=No+Image'} 
                alt={product.title}
                className="absolute top-0 left-0 w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Правая колонка - информация */}
        <div className="p-6 md:w-1/2">
          <h1 className="text-2xl font-bold mb-2 break-words">{product.title}</h1>
          
          <div className="mb-4">
            <span className="inline-block bg-gray-200 px-3 py-1 rounded text-sm">
              {product.category}
            </span>
          </div>
          
          <p className="text-gray-700 mb-4 leading-relaxed break-words">{product.description}</p>
          
          <p className="text-3xl font-bold text-blue-600 mb-6">{product.price.toLocaleString()} ₽</p>
          
          <div className="flex flex-wrap gap-2">
            <Link
              to="/products"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              Назад
            </Link>
            
            {(user?.role === 'seller' || user?.role === 'admin') && (
              <>
                <Link
                  to={`/products/edit/${product.id}`}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                >
                  Изменить
                </Link>
                
                {user?.role === 'admin' && (
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  >
                    Удалить
                  </button>
                )}
              </>
            )}
          </div>
          
          {product.created_by && (
            <p className="text-xs text-gray-400 mt-6">
              ID товара: {product.id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;