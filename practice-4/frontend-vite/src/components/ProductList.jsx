import React from 'react';
import ProductCard from './ProductCard';

export default function ProductList({ products, onEdit, onDelete }) {
    if (!products.length) {
        return (
            <div className="empty-state">
                <p>Товаров пока нет</p>
                <p>Нажмите "Создать товар", чтобы добавить первый товар</p>
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
}