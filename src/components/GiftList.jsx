import { useMemo } from 'react';
import { CheckIcon, ArrowIcon, CircleIcon, UserIcon } from './Icons';
import { correctImageOrientation } from '../utils/imageUtils';

function GiftList({ gifts, onSelectGift, onNavigate }) {
	
	const completionPercent = useMemo(() => {
		if (gifts.length === 0) return 0;
		const sentCount = gifts.filter(g => g.status === 'sent').length;
		return Math.round((sentCount / gifts.length) * 100);
	}, [gifts]);

	const getStatusIcon = (status) => {
		if (status === 'sent') return { Icon: CheckIcon, color: '#31A24C' };
		if (status === 'drafted') return { Icon: ArrowIcon, color: '#F7B928' };
		return { Icon: CircleIcon, color: '#9CA3AF' };
	};

	return (
		<div className="pb-24">
			{/* Header - FULL WIDTH */}
			<div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
				<h1 className="text-lg font-semibold text-gray-900">
					Thank you notes tracker
				</h1>
				<button 
					onClick={() => onNavigate('profile')}
					className="p-2 hover:bg-gray-100 rounded-full transition"
				>
					<UserIcon size={24} color="#374151" />
				</button>
			</div>

			{/* Content with max-width */}
			<div className="max-w-4xl mx-auto">
				{/* Progress Card */}
				<div className="px-4 sm:px-6 py-6">
					<div className="bg-white rounded-2xl p-6 shadow-md">
						<div className="flex justify-between items-center mb-3">
							<span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
								Progress
							</span>
							<span className="text-3xl font-bold text-primary">
								{completionPercent}%
							</span>
						</div>
						<div className="h-4 bg-gray-100 rounded-full overflow-hidden">
							<div 
								className="h-full bg-gradient-to-r from-christmas-light to-christmas-dark rounded-full transition-all duration-500 ease-out shadow-sm"
								style={{ width: `${completionPercent}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Gift List */}
				<div className="px-4 sm:px-6">
					{gifts.length === 0 ? (
						<div className="bg-white rounded-2xl p-12 text-center shadow-sm">
							<div className="mb-4 flex justify-center">
								<CircleIcon size={64} color="#D1D5DB" />
							</div>
							<p className="text-gray-500 text-base">No gifts yet. Add your first one!</p>
						</div>
					) : (
						<div className="space-y-3">
							{gifts.map(gift => {
								const { Icon, color } = getStatusIcon(gift.status);
								return (
									<div 
										key={gift.id}
										onClick={() => onSelectGift(gift)}
										className="bg-white rounded-xl p-4 sm:p-5 flex justify-between items-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
									>
										<div className="flex-1 min-w-0 mr-4">
											<div className="font-semibold text-base sm:text-lg text-gray-900 mb-1 truncate">
												{gift.what}
											</div>
											<div className="text-sm sm:text-base text-gray-600">
												From {gift.who}
											</div>
										</div>
										<div 
											className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
											style={{ backgroundColor: `${color}20` }}
										>
											<Icon size={20} color={color} />
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default GiftList;