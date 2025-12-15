import { useState, useEffect } from 'react';
import { createComment, updateComment, deleteComment, likeComment, S3_BASE_URL } from '../utils/api';
import { HeartIcon, TrashIcon, EditIcon } from './Icons';
import { API_URL, S3_BASE_URL } from '../utils/api';


function CommentSection({ postId, postAuthorId, currentUser, initialComments = [], onUpdate }) {
	const [comments, setComments] = useState(initialComments);
	const [newCommentText, setNewCommentText] = useState('');
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editText, setEditText] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deleteModalCommentId, setDeleteModalCommentId] = useState(null);

	useEffect(() => {
		setComments(initialComments);
	}, [initialComments]);

	const handleAddComment = async (e) => {
		e.preventDefault();
		if (!newCommentText.trim()) return;

		setIsSubmitting(true);
		try {
			await createComment(postId, newCommentText);
			setNewCommentText('');
			await onUpdate();
		} catch (err) {
			console.error('Error adding comment:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditComment = async (commentId) => {
		if (!editText.trim()) return;

		setIsSubmitting(true);
		try {
			await updateComment(commentId, editText);
			setEditingCommentId(null);
			setEditText('');
			await onUpdate();
		} catch (err) {
			console.error('Error editing comment:', err);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleDeleteComment = async (commentId) => {
		try {
			await deleteComment(commentId);
			setDeleteModalCommentId(null);
			await onUpdate();
		} catch (err) {
			console.error('Error deleting comment:', err);
		}
	};

	const handleLikeComment = async (commentId) => {
		try {
			await likeComment(commentId);
			await onUpdate();
		} catch (err) {
			console.error('Error liking comment:', err);
		}
	};

	const canDeleteComment = (comment) => {
		return currentUser && (
			comment.author.id === currentUser.id || 
			postAuthorId === currentUser.id
		);
	};

	const canEditComment = (comment) => {
		return currentUser && comment.author.id === currentUser.id;
	};

	return (
		<div className="pt-4">
			<h4 className="font-semibold text-gray-900 mb-3 text-sm">
				Comments ({comments.length})
			</h4>

			{/* Comments List */}
			<div className="space-y-3 mb-4">
				{comments.map(comment => (
					<div key={comment.id} className="bg-gray-50 rounded-lg p-3">
						<div className="flex items-start gap-2 mb-2">
							{/* Avatar */}
							<div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
								{comment.author.profile_picture ? (
									<img 
										src={comment.author.profile_picture.startsWith('http') 
											? comment.author.profile_picture 
											: `${S3_BASE_URL}${comment.author.profile_picture}`
										}
										alt={comment.author.username}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-xs">
										{comment.author.username.charAt(0).toUpperCase()}
									</div>
								)}
							</div>

							{/* Comment Content */}
							<div className="flex-1 min-w-0">
								<div className="font-semibold text-sm text-gray-900">
									{comment.author.username}
								</div>
								
								{editingCommentId === comment.id ? (
									<div className="mt-2">
										<textarea
											value={editText}
											onChange={(e) => setEditText(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-christmas focus:border-transparent"
											rows="2"
										/>
										<div className="flex gap-2 mt-2">
											<button
												onClick={() => handleEditComment(comment.id)}
												disabled={isSubmitting}
												className="px-3 py-1 bg-gradient-to-r from-christmas-light to-christmas-dark text-white rounded-lg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
											>
												Save
											</button>
											<button
												onClick={() => {
													setEditingCommentId(null);
													setEditText('');
												}}
												className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition"
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<p className="text-sm text-gray-700 mt-1 break-words">
										{comment.text}
									</p>
								)}
							</div>
						</div>

						{/* Comment Actions */}
						<div className="flex items-center gap-3 ml-10">
							<button
								onClick={() => handleLikeComment(comment.id)}
								className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 transition"
							>
								<HeartIcon size={14} color={comment.is_liked ? '#FF385C' : 'currentColor'} filled={comment.is_liked} />
								<span>{comment.like_count}</span>
							</button>

							{canEditComment(comment) && !editingCommentId && (
								<button
									onClick={() => {
										setEditingCommentId(comment.id);
										setEditText(comment.text);
									}}
									className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-500 transition"
								>
									<EditIcon size={14} color="currentColor" />
									<span>Edit</span>
								</button>
							)}

							{canDeleteComment(comment) && (
								<button
									onClick={() => setDeleteModalCommentId(comment.id)}
									className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 transition"
								>
									<TrashIcon size={14} color="currentColor" />
									<span>Delete</span>
								</button>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Add Comment Form */}
			<form onSubmit={handleAddComment} className="flex gap-2">
				<input
					type="text"
					value={newCommentText}
					onChange={(e) => setNewCommentText(e.target.value)}
					placeholder="Add a comment..."
					className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-christmas focus:border-transparent"
				/>
				<button
					type="submit"
					disabled={isSubmitting || !newCommentText.trim()}
					className="px-4 py-2 bg-gradient-to-r from-christmas-light to-christmas-dark text-white rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Post
				</button>
			</form>

			{/* Delete Confirmation Modal */}
			{deleteModalCommentId && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Delete Comment
						</h3>
						<p className="text-sm text-gray-600 mb-6">
							Are you sure you want to delete this comment? This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setDeleteModalCommentId(null)}
								className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
							>
								Cancel
							</button>
							<button
								onClick={() => handleDeleteComment(deleteModalCommentId)}
								className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default CommentSection;