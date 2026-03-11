import { useState, useContext, createContext } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({ name: 'المستخدم', email: 'user@example.com', points: 100 });
  const [orders, setOrders] = useState([]);

  const logout = () => {
    // منطق تسجيل الخروج
  };

  const orderForSomeone = () => {
    // منطق الطلب لشخص آخر
  };

  return (
    <UserContext.Provider value={{ user, orders, logout, orderForSomeone }}>
      {children}
    </UserContext.Provider>
  );
};