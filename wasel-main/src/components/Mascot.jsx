import React from 'react';

const Mascot = ({ message = 'نوصّل حبك لحد الباب 💙', className = '', size = 'md' }) => {
	const sizeClasses = {
		sm: 'w-16 h-16',
		md: 'w-24 h-24',
		lg: 'w-48 h-48'
	};

	return (
		<div className={`mascot ${className}`}>
			<div className="mascot-inner flex flex-col items-center">
				<img
					src="/wasel-mascot.png"
					alt="Wasel Mascot"
					className={`${sizeClasses[size] || sizeClasses.md} object-contain`} 
				/>
				<p className="mascot-message text-center mt-2 text-sm">{message}</p>
			</div>
		</div>
	);
};

export default Mascot;
