import { useState, useEffect } from 'react';
import { getPostLikes, S3_BASE_URL } from '../utils/api';
import LikersModal from './LikersModal';

function LikeAvatars({ postId, likeCount, onNavigateToProfile }) {
	const [showModal, setShowModal] = useState(false);
	const [likers, setLikers] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	// Fetch likers on mount
	useEffect(() => {
		const fetchLikers = async () => {
			try {
				const response = await getPostLikes(postId);
				setLikers(response.data);
			} catch (err) {
				console.error('Error fetching likers:', err);
			}
		};

		fetchLikers();
	}, [postId, likeCount]);

	const handleClick = async () => {
		// If we don't have likers yet, fetch them
		if (likers.length === 0) {
			setIsLoading(true);
			try {
				const response = await getPostLikes(postId);
				setLikers(response.data);
			} catch (err) {
				console.error('Error fetching likers:', err);
			} finally {
				setIsLoading(false);
			}
		}
		setShowModal(true);
	};

	// Get first 3 likers for avatar display
	const displayLikers = likers.slice(0, 3);
	const displayCount = Math.min(likeCount, 3);

	return (
		<>
			<button 
				onClick={handleClick}
				disabled={isLoading}
				className="flex -space-x-2 hover:opacity-70 transition disabled:opacity-50"
			>
				{/* Overlapping Avatars */}
				{displayLikers.length > 0 ? (
					displayLikers.map((user, i) => (
						<div 
							key={user.id || i}
							className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-300"
						>
							{user.profile_picture ? (
								<img 
									src={user.profile_picture.startsWith('http') 
										? user.profile_picture 
										: `${S3_BASE_URL}${user.profile_picture}`
									}
									alt={user.username}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-xs">
									{user.username?.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
					))
				) : (
					// Placeholder avatars while loading
					[...Array(displayCount)].map((_, i) => (
						<div 
							key={i}
							className="w-6 h-6 rounded-full bg-gradient-to-br from-christmas-light to-christmas-dark border-2 border-white flex items-center justify-center"
						>
							<span className="text-white text-xs font-semibold">
								{String.fromCharCode(65 + i)}
							</span>
						</div>
					))
				)}
			</button>

			{/* Modal */}
			{showModal && (
				<LikersModal 
					likers={likers}
					onClose={() => setShowModal(false)}
					onNavigateToProfile={onNavigateToProfile}
				/>
			)}
		</>
	);
}

export default LikeAvatars;