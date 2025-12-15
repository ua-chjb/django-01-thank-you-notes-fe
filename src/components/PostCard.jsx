import { useState } from 'react';
import { HeartIcon, CommentIcon, CheckIcon, ArrowIcon, CircleIcon } from './Icons';
import { likePost, S3_BASE_URL } from '../utils/api';
import LikeAvatars from './LikeAvatars';
import CommentSection from './CommentSection';

function PostCard({ post, currentUser, onSelectPost, onUpdate, onNavigateToUserProfile, onNavigateToStatus }) {
	const [isLiking, setIsLiking] = useState(false);
	const [showComments, setShowComments] = useState(false);

	const getStatusIcon = (status) => {
		if (status === 'sent') return { Icon: CheckIcon, color: '#31A24C' };
		if (status === 'drafted') return { Icon: ArrowIcon, color: '#F7B928' };
		return { Icon: CircleIcon, color: '#9CA3AF' };
	};

	const handleLike = async (e) => {
		e.stopPropagation();
		setIsLiking(true);
		try {
			await likePost(post.id);
			await onUpdate();
		} catch (err) {
			console.error('Error liking post:', err);
		} finally {
			setIsLiking(false);
		}
	};

	const handleToggleComments = (e) => {
		e.stopPropagation();
		setShowComments(!showComments);
	};

	const handleCardClick = () => {
		onSelectPost(post);
	};

	const statusInfo = getStatusIcon(post.status);
	const StatusIcon = statusInfo.Icon;
	const isOwnPost = currentUser && post.author.id === currentUser.id;

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden">
			{/* Header: Author Info - Split clickable areas */}
			<div className="p-4 flex items-center gap-3 border-b border-gray-100">
				{/* LEFT: Profile picture + name (clickable to user profile) - NO FLEX-1 */}
				<div 
					onClick={(e) => {
						e.stopPropagation();
						onNavigateToUserProfile(post.author.username);
					}}
					className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition"
				>
					<div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
						{post.author.profile_picture ? (
							<img 
								src={post.author.profile_picture.startsWith('http') 
									? post.author.profile_picture 
									: `${S3_BASE_URL}${post.author.profile_picture}`
								}
								alt={post.author.username}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold text-sm">
								{post.author.username.charAt(0).toUpperCase()}
							</div>
						)}
					</div>
					<div>
						<div className="font-semibold text-gray-900 text-sm">
							{post.author.first_name || post.author.username}
						</div>
						<div className="text-xs text-gray-500">
							@{post.author.username}
						</div>
					</div>
				</div>

				{/* SPACER - fills the gap (NOT clickable) */}
				<div className="flex-1"></div>

				{/* RIGHT: Status icon */}
				{isOwnPost ? (
					// Own post: clickable status button
					<button
						onClick={(e) => {
							e.stopPropagation();
							onNavigateToStatus(post);
						}}
						className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-70 transition"
						style={{ backgroundColor: `${statusInfo.color}20` }}
					>
						<StatusIcon size={16} color={statusInfo.color} />
					</button>
				) : (
					// Others' posts: non-clickable status indicator
					<div 
						className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
						style={{ backgroundColor: `${statusInfo.color}20` }}
					>
						<StatusIcon size={16} color={statusInfo.color} />
					</div>
				)}
			</div>

			{/* Body: Gift Info - CLICKABLE */}
			<div onClick={handleCardClick} className="p-4 cursor-pointer">
				<h3 className="font-semibold text-base text-gray-900 mb-1">
					{post.what}
				</h3>
				<p className="text-sm text-gray-600 mb-3">
					From {post.who}
				</p>

				{/* Gift Image */}
				{post.gift_image && (
					<div className="w-full rounded-lg overflow-hidden mb-3 bg-gray-100">
						<img 
							src={post.gift_image.startsWith('http') 
								? post.gift_image 
								: `${S3_BASE_URL}${post.gift_image}`
							}
							alt={post.what}
							className="w-full h-auto object-cover"
						/>
					</div>
				)}

				{/* Private Note (Only for Post Author) */}
				{isOwnPost && post.note && (
					<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
						<div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
							Your Private Note
						</div>
						<p className="text-sm text-gray-900 italic line-clamp-3">
							"{post.note}"
						</p>
					</div>
				)}
			</div>

			{/* Like and Comment Actions - NOT CLICKABLE (except buttons) */}
			<div className="px-4 pb-4">
				<div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-100 relative">
					{/* CENTERED: Like Button */}
					<button
						onClick={handleLike}
						disabled={isLiking}
						className="flex items-center gap-2 hover:opacity-70 transition disabled:opacity-50"
					>
						<HeartIcon 
							size={20} 
							color="#FF385C"
							filled={post.is_liked}
						/>
						<span className="text-sm font-medium text-gray-700">
							{post.like_count}
						</span>
					</button>

					{/* CENTERED: Comment Button */}
					<button 
						onClick={handleToggleComments}
						className="flex items-center gap-2 hover:opacity-70 transition"
					>
						<CommentIcon size={20} color="#6B7280" />
						<span className="text-sm font-medium text-gray-700">
							{post.comment_count}
						</span>
					</button>

					{/* Like Avatars - Positioned JUST to the left of the heart */}
					{post.like_count > 0 && (
						<div className="absolute right-[calc(50%+50px)]">
							<LikeAvatars 
								postId={post.id} 
								likeCount={post.like_count}
								onNavigateToProfile={onNavigateToUserProfile}
							/>
						</div>
					)}
				</div>

				{/* Expandable Comments Section - NOT CLICKABLE */}
				{showComments && (
					<div className="mt-4 pt-4 border-t border-gray-100">
						<CommentSection 
							postId={post.id}
							postAuthorId={post.author.id}
							currentUser={currentUser}
							initialComments={post.comments || []}
							onUpdate={onUpdate}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

export default PostCard;