import { useState, useMemo } from 'react';
import { UserIcon } from './Icons';
import PostCard from './PostCard';
import FilterChips from './FilterChips';
import { S3_BASE_URL } from '../utils/api';

function HomeFeed({ posts, currentUser, onSelectPost, onNavigate, onUpdate, onNavigateToUserProfile }) {

	const [activeFilter, setActiveFilter] = useState('all');

	const filteredPosts = useMemo(() => {
		if (activeFilter === 'all') return posts;
		return posts.filter(post => post.status === activeFilter);
	}, [posts, activeFilter]);

	return (
		<div className="pb-24">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
				<h1 className="text-lg font-semibold text-gray-900">
					Home
				</h1>
				<button 
					onClick={() => onNavigate('profile')}
					className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 hover:opacity-80 transition flex-shrink-0"
				>
					{currentUser?.profile_picture ? (
						<img 
							src={currentUser.profile_picture.startsWith('http') 
								? currentUser.profile_picture 
								: `${S3_BASE_URL}${currentUser.profile_picture}`
							}
							alt={currentUser.username}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold text-sm">
							{currentUser?.username?.charAt(0).toUpperCase()}
						</div>
					)}
				</button>
			</div>

			{/* Filter Chips */}
			<FilterChips onFilterChange={setActiveFilter} />

			{/* Posts Feed */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
				{filteredPosts.length === 0 ? (
					<div className="bg-white rounded-2xl p-12 text-center shadow-sm">
						<p className="text-gray-500 text-base">
							{activeFilter === 'all' 
								? 'No posts yet. Be the first to add one!' 
								: `No ${activeFilter.replace('_', ' ')} posts.`
							}
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredPosts.map(post => (
							<PostCard 
								key={post.id}
								post={post}
								currentUser={currentUser}
								onSelectPost={onSelectPost}
								onUpdate={onUpdate}
								onNavigateToUserProfile={onNavigateToUserProfile}
								onNavigateToStatus={(post) => {
									onSelectPost(post);
									onNavigate('status');
								}}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default HomeFeed;