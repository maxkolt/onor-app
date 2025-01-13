import React, { useEffect, useState } from 'react';
import ProductItem from './ProductList';
import ProductList from "./ProductList";

function AdsList() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/ads') // Замените на ваш URL сервера
      .then((response) => response.json())
      .then((data) => setAds(data))
      .catch((err) => console.error('Ошибка при загрузке объявлений:', err));
  }, []);

  return (
    <div>
      <h1>Каталог объявлений</h1>
      <div className="ads-list">
        {ads.map((ad) => (
          <ProductList key={ad._id} product={ad} />
        ))}
      </div>
    </div>
  );
}

export default AdsList;
