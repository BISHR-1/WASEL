import React from 'react';

const ProgressBar = ({ progress }) => (
  <div className="progress-bar" style={{ background: '#eee', borderRadius: 4, height: 10, width: 200 }}>
    <div style={{ width: `${progress || 0}%`, background: '#4caf50', height: '100%', borderRadius: 4 }} />
  </div>
);

export default ProgressBar;