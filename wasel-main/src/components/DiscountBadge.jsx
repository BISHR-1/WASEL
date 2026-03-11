import React from 'react';

const DiscountBadge = ({ discount }) => (
  <div className="discount-badge" style={{position:'absolute',top:0,right:0,background:'#f00',color:'#fff',padding:'2px 8px',borderRadius:4}}>
    {discount || 'خصم'}
  </div>
);

export default DiscountBadge;