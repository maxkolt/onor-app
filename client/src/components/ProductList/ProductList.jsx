import React, { useEffect, useState } from 'react';

function ProductList() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    // Запрос к вашему серверу Express
    fetch('http://localhost:8000/api/ads') // Или замените localhost на ваш продакшн сервер
      .then((response) => response.json())
      .then((data) => setAds(data))
      .catch((err) => console.error('Ошибка загрузки объявлений:', err));
  }, []);

  return (
    <div>
      <h1>Каталог объявлений</h1>
      <ul>
        {ads.map((ad, index) => (
          <li key={index}>
            <strong>Категория:</strong> {ad.category} <br />
            <strong>Описание:</strong> {ad.description} <br />
            <small>Добавлено: {new Date(ad.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductList;
