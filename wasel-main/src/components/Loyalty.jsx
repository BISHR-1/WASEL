import React from 'react';

const Loyalty = ({ points }) => (
  <div className="loyalty">
    <h3>نقاط الولاء: {points || 0}</h3>
  </div>
);

export default Loyalty;