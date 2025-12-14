import { useState, useRef, useEffect } from 'react';
import { BackIcon, CameraIcon, EditIcon, MoreIcon, TrashIcon, CheckIcon, ArrowIcon, CircleIcon, HeartIcon, CommentIcon } from './Icons';
import { motion, useMotionValue, useTransform, animate} from 'framer-motion';
import { updatePost, deletePost, likePost } from '../utils/api';
import CommentSection from './CommentSection';

function GiftDetail({ gift, currentUser, onBack, onStatusClick, onUpdate }) {

	const [showNoteModal, setShowNoteModal] = useState(false);
	const [noteText, setNoteText] = useState(gift.note || '');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [photoError, setPhotoError] = useState('');
	const [noteError, setNoteError] = useState('');
	const [showComments, setShowComments] = useState(true); // Changed to true by default
	const fileInputRef = useRef(null);

	// Swipe-to-delete state for photo
	const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
	const imageContainerRef = useRef(null);
	const deletePhotoModalRef = useRef(null);
	const x = useMotionValue(0);

	// Swipe-to-delete state for note
	const [showDeleteNoteConfirm, setShowDeleteNoteConfirm] = useState(false);
	const noteContainerRef = useRef(null);
	const deleteNoteModalRef = useRef(null);
	const xNote = useMotionValue(0);

	// variables used by both photo and note delete
	const DELETE_BUTTON_WIDTH = 120;
	const SWIPE_THRESHOLD = 30


	// Menu state
	const [showMenu, setShowMenu] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const menuRef = useRef(null);
	const noteModalRef = useRef(null);
	const deleteModalRef = useRef(null);
	
	const isOwnPost = currentUser && currentUser.id === gift.author.id;
	
	const getStatusDisplay = (status) => {
		if (status === 'sent') return { Icon: CheckIcon, color: '#31A24C', label: 'Sent' };
		if (status === 'drafted') return { Icon: ArrowIcon, color: '#F7B928', label: 'Written' };
		return { Icon: CircleIcon, color: '#9CA3AF', label: 'Not Started' };
	};

	const statusDisplay = getStatusDisplay(gift.status);
	const StatusIcon = statusDisplay.Icon;

	// handlers for note delete functionality
	const handleNoteDragEnd = (event, info) => {
		const offset = info.offset.x;
		const velocity = info.velocity.x;
		
		if (offset < 0) {
			if (Math.abs(offset) > SWIPE_THRESHOLD || velocity < -500) {
				animate(xNote, -DELETE_BUTTON_WIDTH, {
					type: "spring",
					stiffness: 300,
					damping: 30
				});
			} else {
				animate(xNote, 0, {
					type: "spring",
					stiffness: 300,
					damping: 30
				});
			}
		} else {
			animate(xNote, 0, {
				type: "spring",
				stiffness: 300,
				damping: 30
			});
		}
	};

	const handleNoteClick = () => {
		// If swiped open, close it
		if (xNote.get() < 0) {
			animate(xNote, 0, {
				type: "spring",
				stiffness: 300,
				damping: 30
			});
			return;
		}
		
		// Otherwise, open edit note modal
		handleEditNote();
	};

	const handleDeleteNoteClick = (e) => {
		e.stopPropagation();
		setShowDeleteNoteConfirm(true);
	};

	const handleConfirmDeleteNote = async () => {
		setIsSubmitting(true);
		animate(xNote, 0, { type: "spring", stiffness: 300, damping: 30 });
		
		try {
			await updatePost(gift.id, {
				what: gift.what,
				who: gift.who,
				note: '', // Remove note
				status: gift.status
			});
			await onUpdate();
			setShowDeleteNoteConfirm(false);
		} catch (err) {
			console.error('Delete note error:', err);
			setNoteError('Failed to delete note');
		} finally {
			setIsSubmitting(false);
		}
	};	


	// handlers for photo delete functionality
	const handleDragEnd = (event, info) => {
		const offset = info.offset.x;
		const velocity = info.velocity.x;
		
		// Only respond to left swipes
		if (offset < 0) {
			// Check if should snap open or closed
			if (Math.abs(offset) > SWIPE_THRESHOLD || velocity < -500) {
				// Snap open
				animate(x, -DELETE_BUTTON_WIDTH, {
					type: "spring",
					stiffness: 300,
					damping: 30
				});
			} else {
				// Snap closed
				animate(x, 0, {
					type: "spring",
					stiffness: 300,
					damping: 30
				});
			}
		} else {
			// Snap closed (swiping right)
			animate(x, 0, {
				type: "spring",
				stiffness: 300,
				damping: 30
			});
		}
	};

	const handleImageClick = () => {
		// If swiped open, close it
		if (x.get() < 0) {
			animate(x, 0, {
				type: "spring",
				stiffness: 300,
				damping: 30
			});
			return;
		}
		
		// Otherwise, open photo change dialog
		handleAddPhoto();
	};

	const handleDeletePhotoClick = (e) => {
		e.stopPropagation();
		setShowDeletePhotoConfirm(true);
	};

	const handleConfirmDeletePhoto = async () => {
		setIsSubmitting(true);
		animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
		
		try {
			const token = localStorage.getItem('access_token');
			const response = await fetch(`https://thankyounotes.today/posts/update/${gift.id}/`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					what: gift.what,
					who: gift.who,
					gift_image: null,
					note: gift.note || '',
					status: gift.status
				})
			});

			if (!response.ok) {
				throw new Error('Failed to delete photo');
			}

			await onUpdate();
			setShowDeletePhotoConfirm(false);
			setPhotoError('');
		} catch (err) {
			console.error('Delete photo error:', err);
			setPhotoError('Failed to delete photo');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Close swipe when clicking outside, for delete photo option
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (imageContainerRef.current && !imageContainerRef.current.contains(event.target)) {
				animate(x, 0, {
					type: "spring",
					stiffness: 300,
					damping: 30
				});
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('touchstart', handleClickOutside);
		
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('touchstart', handleClickOutside);
		};
	}, [x]);

	// Close delete photo modal when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (deletePhotoModalRef.current && !deletePhotoModalRef.current.contains(event.target)) {
				setShowDeletePhotoConfirm(false);
			}
		};

		if (showDeletePhotoConfirm) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showDeletePhotoConfirm]);

	// Close swipe when clicking outside, for delete note option
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (imageContainerRef.current && !imageContainerRef.current.contains(event.target)) {
				animate(x, 0, {
					type: "spring",
					stiffness: 300,
					damping: 30
				});
			}
			if (noteContainerRef.current && !noteContainerRef.current.contains(event.target)) {
				animate(xNote, 0, {
					type: "spring",
					stiffness: 300,
					damping: 30
				});
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('touchstart', handleClickOutside);
		
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('touchstart', handleClickOutside);
		};
	}, [x, xNote]);

	// Close delete note modal when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (deleteNoteModalRef.current && !deleteNoteModalRef.current.contains(event.target)) {
				setShowDeleteNoteConfirm(false);
			}
		};

		if (showDeleteNoteConfirm) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showDeleteNoteConfirm]);



	// Close note modal when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (noteModalRef.current && !noteModalRef.current.contains(event.target)) {
				setShowNoteModal(false);
				setNoteError('');
				setNoteText(gift.note || '');
			}
		};

		if (showNoteModal) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showNoteModal, gift.note]);

	// Close delete modal when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (deleteModalRef.current && !deleteModalRef.current.contains(event.target)) {
				setShowDeleteConfirm(false);
			}
		};

		if (showDeleteConfirm) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showDeleteConfirm]);


	const handleAddPhoto = () => {
		fileInputRef.current?.click();
	};

	const handlePhotoChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsSubmitting(true);
		setPhotoError('');
		
		try {
			const formData = new FormData();
			formData.append('what', gift.what);
			formData.append('who', gift.who);
			formData.append('gift_image', file);
			if (gift.note) formData.append('note', gift.note);
			if (gift.status) formData.append('status', gift.status);

			const token = localStorage.getItem('access_token');
			const response = await fetch(`https://thankyounotes.today/posts/update/${gift.id}/`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`
				},
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Server error:', errorData);
				throw new Error('Upload failed');
			}

			await onUpdate();
		} catch (err) {
			setPhotoError('Failed to upload photo');
			console.error('Photo upload error:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSaveNote = async (e) => {
		if (e) e.preventDefault();
		
		if (!noteText.trim()) {
			setNoteError('Note cannot be empty');
			return;
		}

		setIsSubmitting(true);
		setNoteError('');

		try {
			await updatePost(gift.id, {
				what: gift.what,
				who: gift.who,
				note: noteText,
				status: gift.status
			});
			await onUpdate();
			setShowNoteModal(false);
		} catch (err) {
			setNoteError('Failed to save note');
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditNote = () => {
		setNoteText(gift.note || '');
		setShowNoteModal(true);
	};

	const handleDeleteClick = () => {
		setShowMenu(false);
		setShowDeleteConfirm(true);
	};

	const handleConfirmDelete = async () => {
		setIsSubmitting(true);
		try {
			await deletePost(gift.id);
			await onUpdate();
			onBack();
		} catch (err) {
			console.error('Failed to delete gift:', err);
			setPhotoError('Failed to delete gift');
		} finally {
			setIsSubmitting(false);
			setShowDeleteConfirm(false);
		}
	};

	const handleLike = async () => {
		try {
			await likePost(gift.id);
			await onUpdate();
		} catch (err) {
			console.error('Error liking post:', err);
		}
	};

	// Handle Enter key in note modal
	const handleNoteKeyDown = (e) => {
		if (e.key === 'Enter') {
			handleSaveNote();
		}
	};


	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
				<button 
					onClick={onBack}
					className="p-2 hover:bg-gray-100 rounded-full transition"
				>
					<BackIcon size={24} color="#374151" />
				</button>
				<h3 className="text-lg font-semibold text-gray-900">
					Gift Details
				</h3>
				<div className="w-10"></div>
			</div>

			{/* Main Content */}
			<div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
				{/* Gift Card */}
				<div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md">
				{/* Author Info */}
					{/* Author Info */}
					<div className="mb-6 pb-6 border-b border-gray-200 flex items-center gap-3">
						<div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
							{gift.author.profile_picture ? (
								<img 
									src={gift.author.profile_picture.startsWith('http') 
										? gift.author.profile_picture 
										: `https://thankyounotes.today/${gift.author.profile_picture}`
									}
									alt={gift.author.username}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold">
									{gift.author.username.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
						<div className="flex-1">
							<div className="font-semibold text-gray-900">
								{gift.author.first_name || gift.author.username}
							</div>
							<div className="text-sm text-gray-500">
								@{gift.author.username}
							</div>
						</div>
						
						{/* Status Icon - Only show for OTHER people's posts */}
						{!isOwnPost && (
							<div 
								className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
								style={{ backgroundColor: `${statusDisplay.color}20` }}
							>
								<StatusIcon size={20} color={statusDisplay.color} />
							</div>
						)}
						
						{/* Three-dot menu (only for own posts) */}
						{isOwnPost && (
							<div className="relative" ref={menuRef}>
								<button 
									onClick={() => setShowMenu(!showMenu)}
									className="p-2 hover:bg-gray-100 rounded-full transition"
								>
									<MoreIcon size={24} color="#374151" />
								</button>
								
								{/* Dropdown Menu */}
								{showMenu && (
									<div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
										<button
											onClick={handleDeleteClick}
											className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 transition flex items-center gap-2 font-medium text-sm"
										>
											<TrashIcon size={18} color="#DC2626" />
											Delete Gift
										</button>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Gift Header */}
					<div className="mb-8">
						<h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
							{gift.what}
						</h2>
						<p className="text-base sm:text-lg text-gray-600">
							From {gift.who}
						</p>
					</div>

					{/* Photo Error Message */}
					{photoError && (
						<div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
							{photoError}
						</div>
					)}

					{/* Add/Change Photo Button (only for own posts) */}
					{isOwnPost && (
						<>
							{!gift.gift_image ? (
								<button 
									onClick={handleAddPhoto}
									disabled={isSubmitting}
									className="w-full py-4 mb-4 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl text-gray-600 font-medium hover:border-christmas hover:text-christmas transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<CameraIcon size={20} color="currentColor" />
									{isSubmitting ? 'Uploading...' : 'Add Photo'}
								</button>
							) : (
								<>
									{/* Display Image (for own posts) - SWIPEABLE to delete */}
									{isOwnPost && gift.gift_image && (
										<>
											<div 
												ref={imageContainerRef}
												className="relative mb-2 rounded-xl overflow-hidden shadow-sm"
											>
												{/* Delete Button Background */}
												<div 
													className="absolute inset-0 bg-red-600 flex items-center justify-end pr-6 rounded-xl"
													style={{
														borderTop: '1px solid white',
														borderBottom: '1px solid white',
														borderLeft: '1px solid white',
														borderRight: '2px solid white'
													}}
												>
													<button
														onClick={handleDeletePhotoClick}
														className="text-white font-bold text-base px-4 py-2 active:opacity-70 transition-opacity"
													>
														Delete
													</button>
												</div>

												{/* Image Container with Framer Motion */}
												<motion.div
													drag="x"
													dragConstraints={{ left: -DELETE_BUTTON_WIDTH, right: 0 }}
													dragElastic={0.1}
													dragMomentum={false}
													onDragEnd={handleDragEnd}
													onClick={handleImageClick}
													style={{ x }}
													className="relative bg-white cursor-pointer select-none"
												>
													<img 
														src={gift.gift_image.startsWith('http') ? gift.gift_image : `https://thankyounotes.today/${gift.gift_image}`}
														alt={gift.what}
														className="w-full h-auto object-cover pointer-events-none"
														draggable="false"
													/>
												</motion.div>
											</div>
										</>
									)}
									{/* Delete Photo Confirmation Modal */}
									{showDeletePhotoConfirm && (
										<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
											<motion.div 
												ref={deletePhotoModalRef} 
												className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
												initial={{ scale: 0.9, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												transition={{ type: "spring", stiffness: 300, damping: 25 }}
											>
												<h3 className="text-xl font-bold text-gray-900 mb-2">
													Delete Photo?
												</h3>
												<p className="text-gray-600 mb-6">
													This will remove the photo from your post. You can add a new one anytime.
												</p>
												<div className="flex gap-3">
													<button
														onClick={() => setShowDeletePhotoConfirm(false)}
														className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
													>
														Cancel
													</button>
													<button
														onClick={handleConfirmDeletePhoto}
														disabled={isSubmitting}
														className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
													>
														{isSubmitting ? 'Deleting...' : 'Delete'}
													</button>
												</div>
											</motion.div>
										</div>
									)}
								</>
							)}
							
							<input 
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handlePhotoChange}
								className="hidden"
							/>
						</>
					)}

					{/* Display Image (for non-own posts) */}
					{!isOwnPost && gift.gift_image && (
						<div className="w-full mb-4 rounded-xl overflow-hidden shadow-sm">
							<img 
								src={gift.gift_image.startsWith('http') ? gift.gift_image : `https://thankyounotes.today/${gift.gift_image}`}
								alt={gift.what}
								className="w-full h-auto object-cover"
							/>
						</div>
					)}

					{/* Draft/Edit Note Button (only for own posts) */}
					{isOwnPost && (
						<>
							{!gift.note ? (
								<button 
									onClick={() => setShowNoteModal(true)}
									className="w-full py-4 mt-6 mb-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl text-gray-600 font-medium hover:border-christmas hover:text-christmas transition flex items-center justify-center gap-2"
								>
									<EditIcon size={20} color="currentColor" />
									Draft Thank You Note
								</button>
							) : (
								<>
									{/* Display Note (for own posts) - SWIPEABLE to delete */}
									{isOwnPost && gift.note && (
										<>
											<div 
												ref={noteContainerRef}
												className="relative mb-2 rounded-xl overflow-hidden shadow-sm"
											>
												{/* Delete Button Background */}
												{/* Delete Button Background - with white border to cover corners */}
												<div 
													className="absolute inset-0 bg-red-600 flex items-center justify-end pr-6 border-1 border-white rounded-xl"
													style={{
														borderTop: '1px solid white',
														borderBottom: '1px solid white',
														borderLeft: '1px solid white',
														borderRight: '2px solid white'
													}}													
												>
													<button
														onClick={handleDeleteNoteClick}
														className="text-white font-bold text-base px-4 py-2 active:opacity-70 transition-opacity"
													>
														Delete
													</button>
												</div>
												{/* Note Container with Framer Motion */}
												<motion.div
													drag="x"
													dragConstraints={{ left: -DELETE_BUTTON_WIDTH, right: 0 }}
													dragElastic={0.1}
													dragMomentum={false}
													onDragEnd={handleNoteDragEnd}
													onClick={handleNoteClick}
													style={{ x: xNote }}
													className="relative bg-gray-50 border border-gray-200 cursor-pointer select-none"
												>
													<div className="p-4 sm:p-5">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
															Thank You Note
														</div>
														<p className="text-sm sm:text-base leading-relaxed text-gray-900 italic break-words pointer-events-none">
															"{gift.note}"
														</p>
													</div>
												</motion.div>
											</div>
										</>
									)}
									{/* Delete Note Confirmation Modal */}
									{showDeleteNoteConfirm && (
										<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
											<motion.div 
												ref={deleteNoteModalRef} 
												className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
												initial={{ scale: 0.9, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												transition={{ type: "spring", stiffness: 300, damping: 25 }}
											>
												<h3 className="text-xl font-bold text-gray-900 mb-2">
													Delete Note?
												</h3>
												<p className="text-gray-600 mb-6">
													This will remove your thank you note. You can write a new one anytime.
												</p>
												<div className="flex gap-3">
													<button
														onClick={() => setShowDeleteNoteConfirm(false)}
														className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
													>
														Cancel
													</button>
													<button
														onClick={handleConfirmDeleteNote}
														disabled={isSubmitting}
														className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
													>
														{isSubmitting ? 'Deleting...' : 'Delete'}
													</button>
												</div>
											</motion.div>
										</div>
									)}
								</>
							)}
						</>
					)}

					{/* Like and Comment Stats */}
					<div className="flex items-center justify-center gap-6 pb-4 mb-4 border-b border-gray-200">
						<button
							onClick={handleLike}
							className="flex items-center gap-2 hover:opacity-70 transition"
						>
							<HeartIcon 
								size={24} 
								color="#FF385C"
								filled={gift.is_liked}
							/>
							<span className="text-base font-medium text-gray-700">
								{gift.like_count}
							</span>
						</button>

						<div className="flex items-center gap-2">
							<CommentIcon size={24} color="#6B7280" />
							<span className="text-base font-medium text-gray-700">
								{gift.comment_count}
							</span>
						</div>
					</div>

					{/* Comments Section - Always visible */}
					<CommentSection 
						postId={gift.id}
						postAuthorId={gift.author.id}
						currentUser={currentUser}
						initialComments={gift.comments || []}
						onUpdate={onUpdate}
					/>

					{/* Status Section (only for own posts) */}
					{isOwnPost && (
						<div className="text-center pt-6 border-t border-gray-200 mt-6">
							<div className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
								Status
							</div>
							<div 
								onClick={onStatusClick}
								className="inline-flex flex-col items-center gap-4 cursor-pointer p-4 rounded-xl hover:bg-gray-50 transition"
							>
								<div 
									className="w-10 h-10 rounded-full flex items-center justify-center"
									style={{ backgroundColor: `${statusDisplay.color}20` }}
								>
									<StatusIcon size={20} color={statusDisplay.color} />
								</div>
								<span 
									className="text-base sm:text-lg font-semibold"
									style={{ color: statusDisplay.color }}
								>
									{statusDisplay.label}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Note Modal */}
			{showNoteModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div ref={noteModalRef} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
						<h3 className="text-xl font-bold text-gray-900 mb-4">
							{gift.note ? 'Edit Thank You Note' : 'Write Thank You Note'}
						</h3>
						<form onSubmit={handleSaveNote}>
							<textarea
								value={noteText}
								onChange={(e) => setNoteText(e.target.value)}
								onKeyDown={handleNoteKeyDown}
								placeholder={`Dear ${gift.who}, thank you so much for...`}
								className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-christmas focus:border-transparent transition resize-none"
							/>
							{noteError && (
								<div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
									{noteError}
								</div>
							)}
							<div className="text-xs text-gray-500 mt-2 mb-4">
								Press Ctrl+Enter (or Cmd+Enter on Mac) to save
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => {
										setShowNoteModal(false);
										setNoteError('');
										setNoteText(gift.note || '');
									}}
									className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="flex-1 py-3 bg-gradient-to-r from-christmas-light to-christmas-dark text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? 'Saving...' : 'Save Note'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div ref={deleteModalRef} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
						<h3 className="text-xl font-bold text-gray-900 mb-2">
							Delete Gift?
						</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete "{gift.what}"? This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmDelete}
								disabled={isSubmitting}
								className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default GiftDetail;