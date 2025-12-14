import { useState } from 'react';

function FilterChips({ onFilterChange }) {
	const [activeFilter, setActiveFilter] = useState('all');

	const filters = [
		{ id: 'all', label: 'All Posts' },
		{ id: 'not_started', label: 'Not Started' },
		{ id: 'drafted', label: 'Written' },
		{ id: 'sent', label: 'Sent' }
	];

	const handleFilterClick = (filterId) => {
		setActiveFilter(filterId);
		onFilterChange(filterId);
	};

	return (
		<div className="px-4 sm:px-6 py-3 bg-white border-b border-gray-200 overflow-x-auto">
			<div className="flex gap-2 min-w-max">
				{filters.map(filter => (
					<button
						key={filter.id}
						onClick={() => handleFilterClick(filter.id)}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
							activeFilter === filter.id
								? 'relative overflow-hidden'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						{activeFilter === filter.id && (
							<>
								<div className="absolute inset-0 bg-gradient-to-br from-christmas-light to-christmas-dark" />
								<div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
							</>
						)}
						<span className={`relative z-10 ${activeFilter === filter.id ? 'text-white' : ''}`}>
							{filter.label}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

export default FilterChips;