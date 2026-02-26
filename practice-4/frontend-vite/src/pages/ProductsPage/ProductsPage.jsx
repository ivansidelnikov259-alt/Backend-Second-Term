import React, { useState, useEffect } from 'react';
import './ProductsPage.scss';
import { api } from '../../api';

// Компонент карточки товара
const ProductCard = ({ product, onEdit, onDelete }) => {
    const [imageError, setImageError] = useState(false);
    
    return (
        <div className="product-card">
            <div className="product-card__image">
                <img 
                    src={imageError ? 'https://via.placeholder.com/300x200?text=Нет+фото' : (product.imageUrl || 'https://via.placeholder.com/300x200?text=Нет+фото')} 
                    alt={product.name}
                    onError={() => setImageError(true)}
                />
            </div>
            <div className="product-card__content">
                <h3 className="product-card__title">{product.name}</h3>
                <div className="product-card__category">{product.category || 'Без категории'}</div>
                <p className="product-card__description">{product.description || 'Нет описания'}</p>
                <div className="product-card__details">
                    <span className="product-card__price">{product.price?.toLocaleString() || 0} ₽</span>
                    <span className="product-card__stock">В наличии: {product.stock || 0}</span>
                </div>
                <div className="product-card__actions">
                    <button className="btn btn--edit" onClick={() => onEdit(product)}>
                        ✏️ Редактировать
                    </button>
                    <button className="btn btn--delete" onClick={() => onDelete(product.id)}>
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        </div>
    );
};

// Компонент списка товаров
const ProductList = ({ products, onEdit, onDelete }) => {
    if (!products || products.length === 0) {
        return (
            <div className="empty-state">
                <p>Товаров пока нет</p>
                <p className="empty-state__hint">Нажмите "Создать товар", чтобы добавить первый товар</p>
            </div>
        );
    }

    return (
        <div className="product-list">
            {products.map(product => (
                <ProductCard 
                    key={product.id}
                    product={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

// Компонент модального окна
const ProductModal = ({ open, mode, initialProduct, onClose, onSubmit }) => {
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
                            placeholder="Например: Электроника"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Описание</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Подробное описание товара"
                            rows="4"
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
                                    alt="Предпросмотр" 
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/100?text=Ошибка';
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
};

// Главная страница
export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            alert('Не удалось загрузить товары. Проверьте, запущен ли сервер.');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setEditingProduct(product);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            return;
        }

        try {
            await api.deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            alert('Не удалось удалить товар');
        }
    };

    const handleSubmit = async (productData) => {
        try {
            if (modalMode === 'create') {
                const newProduct = await api.createProduct(productData);
                setProducts([...products, newProduct]);
            } else {
                const updatedProduct = await api.updateProduct(editingProduct.id, productData);
                setProducts(products.map(p => 
                    p.id === editingProduct.id ? updatedProduct : p
                ));
            }
            closeModal();
        } catch (error) {
            console.error('Ошибка сохранения товара:', error);
            alert('Не удалось сохранить товар');
        }
    };

    return (
        <div className="products-page">
            <header className="header">
                <div className="container">
                    <h1>Мой интернет-магазин</h1>
                    <p className="header__stats">Товаров в наличии: {products.length}</p>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h2 className="toolbar__title">Каталог товаров</h2>
                        <button className="btn btn--primary" onClick={openCreateModal}>
                            + Создать товар
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading">Загрузка товаров...</div>
                    ) : (
                        <ProductList 
                            products={products}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </main>

            <footer className="footer">
                <div className="container">
                    <p>© {new Date().getFullYear()} Интернет-магазин. Все права защищены.</p>
                </div>
            </footer>

            <ProductModal
                open={modalOpen}
                mode={modalMode}
                initialProduct={editingProduct}
                onClose={closeModal}
                onSubmit={handleSubmit}
            />
        </div>
    );
}