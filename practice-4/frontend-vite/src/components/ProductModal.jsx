import React, { useState, useEffect } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        stock: '',
        imageUrl: ''
    });

    useEffect(() => {
        if (open && initialProduct) {
            setFormData({
                name: initialProduct.name || '',
                price: initialProduct.price || '',
                description: initialProduct.description || '',
                category: initialProduct.category || '',
                stock: initialProduct.stock || '',
                imageUrl: initialProduct.imageUrl || ''
            });
        } else {
            setFormData({
                name: '',
                price: '',
                description: '',
                category: '',
                stock: '',
                imageUrl: ''
            });
        }
    }, [open, initialProduct]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Валидация
        if (!formData.name.trim()) {
            alert('Введите название товара');
            return;
        }
        if (!formData.price || Number(formData.price) <= 0) {
            alert('Введите корректную цену');
            return;
        }
        
        onSubmit({
            ...formData,
            price: Number(formData.price),
            stock: Number(formData.stock) || 0
        });
    };

    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                    <h2 className="modal__title">
                        {mode === 'edit' ? 'Редактировать товар' : 'Создать новый товар'}
                    </h2>
                    <button className="modal__close" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal__form">
                    <div className="form-group">
                        <label>Название товара *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Например: Смартфон iPhone 15"
                            required
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Цена (₽) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="99990"
                                min="0"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Количество на складе</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="10"
                                min="0"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Категория</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder="Например: Смартфоны"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Описание</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Краткое описание товара"
                            rows="3"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Ссылка на фото</label>
                        <input
                            type="url"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                        />
                        {formData.imageUrl && (
                            <div className="image-preview">
                                <img 
                                    src={formData.imageUrl} 
                                    alt="Preview" 
                                    style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px' }}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/100?text=Error';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="modal__footer">
                        <button type="button" className="btn btn--secondary" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === 'edit' ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}