import { useState, useRef } from 'react';
import { BackIcon, CameraIcon } from './Icons';
import { createPost } from '../utils/api';

function AddGift({ onBack, onSuccess }) {
	const [what, setWhat] = useState('');
	const [who, setWho] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!what.trim() || !who.trim()) {
			setError('Please fill in all fields');
			return;
		}

		setIsSubmitting(true);
		setError('');

		try {
			await createPost({ what, who });
			await onSuccess();
			onBack();
		} catch (err) {
			setError('Failed to add gift. Please try again.');
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 pb-24">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
				<button 
					onClick={onBack}
					className="p-2 hover:bg-gray-100 rounded-full transition"
				>
					<BackIcon size={24} color="#374151" />
				</button>
				<h3 className="text-lg font-semibold text-gray-900">
					Add Gift
				</h3>
			</div>

			{/* Form */}
			<div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
				<form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-md">
					{error && (
						<div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
							{error}
						</div>
					)}

					<div className="mb-6">
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							What did you receive?
						</label>
						<input
							type="text"
							value={what}
							onChange={(e) => setWhat(e.target.value)}
							placeholder="e.g., Sweater, Book, Gift card"
							className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-christmas focus:border-transparent transition"
						/>
					</div>

					<div className="mb-8">
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							Who gave it to you?
						</label>
						<input
							type="text"
							value={who}
							onChange={(e) => setWho(e.target.value)}
							placeholder="e.g., Mom, John, Aunt Sarah"
							className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-christmas focus:border-transparent transition"
						/>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full py-4 bg-gradient-to-r from-christmas-light to-christmas-dark text-white rounded-xl font-semibold text-base hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? 'Adding...' : 'Add Gift'}
					</button>
				</form>
			</div>
		</div>
	);
}

export default AddGift;