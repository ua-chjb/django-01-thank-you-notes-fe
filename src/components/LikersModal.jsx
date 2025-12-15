import { useRef, useEffect } from 'react';
import { UserIcon } from './Icons';

function LikersModal({ likers, onClose, onNavigateToProfile }) {
	const modalRef = useRef(null);

	// Close when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [onClose]);

	// Close on Escape key
	useEffect(() => {
		const handleEscape = (event) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [onClose]);

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div 
				ref={modalRef}
				className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col"
			>
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
					<h3 className="text-lg font-bold text-gray-900">
						Liked by
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
					>
						×
					</button>
				</div>

				{/* Scrollable List */}
				<div className="flex-1 overflow-y-auto">
					{likers.length === 0 ? (
						<div className="p-8 text-center text-gray-500">
							No likes yet
						</div>
					) : (
						<div className="divide-y divide-gray-100">
							{likers.map(user => (
								<button
									key={user.id}
									onClick={() => onNavigateToProfile(user.username)}
  									className="flex items-center gap-3 p-3 cursor-pointer transition last:rounded-b-2xl"
								>
									{/* Profile Picture */}
									<div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
										{user.profile_picture ? (
											<img 
												src={user.profile_picture.startsWith('http') 
													? user.profile_picture 
													: `${API_URL}${user.profile_picture}`
												}
												alt={user.username}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold">
												{user.username.charAt(0).toUpperCase()}
											</div>
										)}
									</div>

									{/* User Info */}
									<div className="flex-1 text-left">
										<div className="font-semibold text-gray-900">
											{user.first_name || user.username}
										</div>
										<div className="text-sm text-gray-500">
											@{user.username}
										</div>
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default LikersModal;