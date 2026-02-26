import React, { useState, useEffect } from 'react';
import './ProductsPage.scss';
import ProductList from '../../components/ProductList';
import ProductModal from '../../components/ProductModal';
import { api } from '../../api';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingProduct, setEditingProduct] = useState(null);

    // Загрузка товаров при монтировании компонента
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
                    <p>Товаров в наличии: {products.length}</p>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h2>Каталог товаров</h2>
                        <button className="btn btn--primary" onClick={openCreateModal}>
                            + Создать товар
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading">Загрузка...</div>
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