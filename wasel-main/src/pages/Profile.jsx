import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import Loyalty from '../components/Loyalty';
import ProgressBar from '../components/ProgressBar';

const Profile = () => {
  const { user, orders, logout, orderForSomeone } = useUser();
  const [activeOrders, setActiveOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    // جلب الطلبات
  };

  const handleLogout = () => {
    logout();
  };

  const handleOrderForSomeone = () => {
    orderForSomeone();
  };

  return (
    <div className="profile-page">
      <h1>الملف الشخصي</h1>
      <div className="user-info">
        <p>الاسم: {user.name}</p>
        <p>البريد: {user.email}</p>
      </div>
      <Loyalty points={user.points} />
      <div className="orders">
        <h2>الطلبات الحالية</h2>
        {activeOrders.map(order => (
          <div key={order.id}>
            <p>حالة الطلب: {order.status}</p>
            <ProgressBar progress={order.progress} />
          </div>
        ))}
        <h2>الطلبات السابقة</h2>
        {pastOrders.map(order => (
          <div key={order.id}>
            <p>{order.date} - {order.total} ل.س</p>
          </div>
        ))}
      </div>
      <button onClick={handleOrderForSomeone}>الطلب لشخص آخر</button>
      <button onClick={handleLogout}>تسجيل الخروج</button>
    </div>
  );
};

export default Profile;
