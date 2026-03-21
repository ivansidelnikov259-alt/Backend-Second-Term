import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    imageUrl: ''
  });
  const [previewImage, setPreviewImage] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setFormData({
        title: response.data.title,
        category: response.data.category,
        description: response.data.description,
        price: response.data.price,
        imageUrl: response.data.imageUrl || ''
      });
      setPreviewImage(response.data.imageUrl || '');
    } catch (err) {
      setError('Ошибка загрузки товара');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (name === 'imageUrl') {
      setPreviewImage(value);
      setImageError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id) {
        await api.put(`/products/${id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения товара');
    } finally {
      setLoading(false);
    }
  };

  const imageExamples = [
    { name: '📱 Телефон', url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400' },
    { name: '💻 Ноутбук', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400' },
    { name: '🎧 Наушники', url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400' },
    { name: '⌚ Часы', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
    { name: '📷 Камера', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400' },
    { name: '📚 Книга', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' },
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">
        {id ? 'Редактирование товара' : 'Создание товара'}
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm font-medium">Название</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm font-medium">Категория</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm font-medium">Описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm font-medium">Цена (₽)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm font-medium">URL фотографии</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Вставьте ссылку на изображение из интернета
          </p>
        </div>
        
        {/* Превью изображения с адаптивным контейнером */}
        {previewImage && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-sm font-medium">Предпросмотр:</label>
            <div className="relative w-full max-w-[200px] sm:max-w-[250px] mx-auto">
              <div className="relative pt-[100%] bg-gray-100 rounded-lg overflow-hidden border">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="absolute top-0 left-0 w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400?text=Invalid+URL';
                    setImageError(true);
                  }}
                />
              </div>
            </div>
            {imageError && (
              <p className="text-xs text-red-500 text-center mt-1">
                Не удалось загрузить изображение по указанной ссылке
              </p>
            )}
          </div>
        )}
        
        {/* Быстрые примеры изображений - адаптивная сетка */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 text-sm font-medium">Быстрая вставка:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {imageExamples.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, imageUrl: example.url });
                  setPreviewImage(example.url);
                  setImageError(false);
                }}
                className="text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 sm:px-3 sm:py-2 rounded transition text-left truncate"
              >
                {example.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 sm:flex-1"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition sm:flex-1"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;