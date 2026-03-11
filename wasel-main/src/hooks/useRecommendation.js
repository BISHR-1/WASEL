import { useState, useEffect } from 'react';

// Minimal recommendation hook for demo/fix
export function useRecommendation() {
	const [recommendations, setRecommendations] = useState([]);
	useEffect(() => {
		// Example: fetch or set static recommendations
		setRecommendations([
			{ id: 1, name: 'منتج موصى', price: 100 },
			{ id: 2, name: 'منتج آخر', price: 200 }
		]);
	}, []);
	return { recommendations };
}

export default useRecommendation;
