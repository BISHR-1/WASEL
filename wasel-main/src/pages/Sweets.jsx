import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import AppFooter from '@/components/common/AppFooter';

const Sweets = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await base44.entities.SweetsItem.list();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setItems([]);
        console.error('خطأ في جلب الحلويات من base44:', err);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="sweets-page">
      <h1 className="text-center text-2xl font-bold mb-4">الحلويات</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {items.map(item => (
          <div key={item.id} className="border p-2 rounded shadow">
            <h2 className="font-bold text-lg mb-2">{item.name}</h2>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
      <AppFooter />
    </div>
  );
};

export default Sweets;
