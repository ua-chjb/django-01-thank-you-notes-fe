import { useState, useRef, useCallback } from 'react';
import { updatePost } from '../utils/api';
import { BackIcon, CheckIcon } from './Icons';
import ConfettiBurst from './ConfettiBurst';

function StatusToggle({ gift, onBack, onUpdate }) {
  const [isWritten, setIsWritten] = useState(gift.status === 'drafted' || gift.status === 'sent');
  const [isSent, setIsSent] = useState(gift.status === 'sent');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Confetti state
  // Using an incrementing ID to ensure ConfettiBurst's useEffect runs exactly once per trigger.
  const [confettiTriggerId, setConfettiTriggerId] = useState(0); 
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0, y: 0 });
  // Ref to prevent multiple triggers if the parent re-renders before the animation starts/completes.
  const isConfettiActive = useRef(false);
  
  // Draggable state
  const [writtenDragX, setWrittenDragX] = useState(0);
  const [sentDragX, setSentDragX] = useState(0);
  const [isDraggingWritten, setIsDraggingWritten] = useState(false);
  const [isDraggingSent, setIsDraggingSent] = useState(false);
  
  const writtenTrackRef = useRef(null);
  const sentTrackRef = useRef(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  // const isMobile=true;

  const updateStatus = async (newStatus) => {
    try {
      await updatePost(gift.id, { 
        what: gift.what,
        who: gift.who,
        status: newStatus 
      });
      await onUpdate();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const triggerConfetti = (element) => {
    if (isConfettiActive.current) return;
    
    const rect = element.getBoundingClientRect();
    
    // 🔴 CRITICAL FIX: Deferred Activation
    // Wrap the state update in setTimeout(..., 0) to push the confetti activation 
    // to the next execution cycle. This ensures that all synchronous and 
    // asynchronous state updates from handleSentPointerUp have completed their 
    // render batch before the Confetti component attempts its side effect, 
    // resolving the race condition that caused the double-fire and cut-off.
    setTimeout(() => {
      setConfettiOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      setConfettiTriggerId(prev => prev + 1);
    }, 0);
    
    isConfettiActive.current = true;
  };
  
  // Use useCallback to stabilize the prop passed to the child.
  const handleConfettiComplete = useCallback(() => {
    isConfettiActive.current = false;
  }, []);
  

  // Desktop toggle handlers
  const handleWrittenToggle = async () => {
    if (isMobile) return;
    
    setIsUpdating(true);
    const newWritten = !isWritten;
    setIsWritten(newWritten);
    
    if (!newWritten) {
      setIsSent(false);
      await updateStatus('not_started');
    } else {
      await updateStatus('drafted');
    }
    setIsUpdating(false);
  };

  const handleSentToggle = async () => {
    if (!isWritten || isMobile) return;
    
    setIsUpdating(true);
    const newSent = !isSent;
    setIsSent(newSent);
    await updateStatus(newSent ? 'sent' : 'drafted');
    
    // Trigger confetti on completion
    if (newSent && sentTrackRef.current) {
      triggerConfetti(sentTrackRef.current);
    }
    
    setIsUpdating(false);
  };

  // --------------------------------------------------------
  // Mobile POINTER handlers for "Written" (Fixes Touch Lag)
  // --------------------------------------------------------
  const handleWrittenPointerDown = (e) => {
    if (!isMobile) return;
    e.preventDefault();
    
    // CRITICAL: Lock pointer to element for instant response
    e.currentTarget.setPointerCapture(e.pointerId);
    
    setIsDraggingWritten(true);
    
    if (isWritten && writtenTrackRef.current) {
      const trackRect = writtenTrackRef.current.getBoundingClientRect();
      const thumbWidth = 60;
      const maxDrag = trackRect.width - thumbWidth;
      setWrittenDragX(maxDrag);
    }
  };

  const handleWrittenPointerMove = (e) => {
    if (!isDraggingWritten || !writtenTrackRef.current) return;
    e.preventDefault();
    
    // Pointer events use e.clientX directly (no touches array)
    const clientX = e.clientX;
    const trackRect = writtenTrackRef.current.getBoundingClientRect();
    const thumbWidth = 60;
    const maxDrag = trackRect.width - thumbWidth;
    
    let newX = clientX - trackRect.left - thumbWidth / 2;
    newX = Math.max(0, Math.min(newX, maxDrag));
    
    setWrittenDragX(newX);
  };

  const handleWrittenPointerUp = async (e) => {
    if (!isDraggingWritten || !writtenTrackRef.current) return;
    
    // Release capture
    if (e.currentTarget) {
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
    }

    const trackRect = writtenTrackRef.current.getBoundingClientRect();
    const thumbWidth = 60;
    const maxDrag = trackRect.width - thumbWidth;
    const threshold = maxDrag * 0.8;
    const reverseThreshold = maxDrag * 0.2;
    
    if (writtenDragX >= threshold && !isWritten) {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setWrittenDragX(maxDrag);
      setIsWritten(true);
      setIsUpdating(true);
      await updateStatus('drafted');
      setIsUpdating(false);
    }
    else if (writtenDragX <= reverseThreshold && isWritten) {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setWrittenDragX(0);
      setIsWritten(false);
      setIsSent(false);
      setIsUpdating(true);
      await updateStatus('not_started');
      setIsUpdating(false);
    }
    
    setIsDraggingWritten(false);
    setWrittenDragX(0);
  };

  // --------------------------------------------------------
  // Mobile POINTER handlers for "Sent" (Fixes Touch Lag)
  // --------------------------------------------------------
  const handleSentPointerDown = (e) => {
    if (!isMobile || !isWritten) return;
    e.preventDefault();
    
    // CRITICAL: Lock pointer to element for instant response
    e.currentTarget.setPointerCapture(e.pointerId);

    setIsDraggingSent(true);
    
    if (isSent && sentTrackRef.current) {
      const trackRect = sentTrackRef.current.getBoundingClientRect();
      const thumbWidth = 60;
      const maxDrag = trackRect.width - thumbWidth;
      setSentDragX(maxDrag);
    }
  };

  const handleSentPointerMove = (e) => {
    if (!isDraggingSent || !sentTrackRef.current) return;
    e.preventDefault();

    const clientX = e.clientX;
    const trackRect = sentTrackRef.current.getBoundingClientRect();
    const thumbWidth = 60;
    const maxDrag = trackRect.width - thumbWidth;
    
    let newX = clientX - trackRect.left - thumbWidth / 2;
    newX = Math.max(0, Math.min(newX, maxDrag));
    
    setSentDragX(newX);
  };

  const handleSentPointerUp = async (e) => {
    if (!isDraggingSent || !sentTrackRef.current) return;
    
    // Release capture
    if (e.currentTarget) {
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
    }

    const trackRect = sentTrackRef.current.getBoundingClientRect();
    const thumbWidth = 60;
    const maxDrag = trackRect.width - thumbWidth;
    const threshold = maxDrag * 0.8;
    const reverseThreshold = maxDrag * 0.2;
    
    if (sentDragX >= threshold && !isSent) {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // All synchronous UI updates first
      setSentDragX(maxDrag);
      setIsSent(true);
      
      // All asynchronous network/loading updates
      setIsUpdating(true);
      await updateStatus('sent');
      setIsUpdating(false);
      
      // Final trigger for animation, now deferred inside triggerConfetti
      triggerConfetti(sentTrackRef.current);
    }
    else if (sentDragX <= reverseThreshold && isSent) {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setSentDragX(0);
      setIsSent(false);
      setIsUpdating(true);
      await updateStatus('drafted');
      setIsUpdating(false);
    }
    
    setIsDraggingSent(false);
    setSentDragX(0);
  };

  const getBackgroundStyle = (dragX, trackRef, isActive) => {
    if (isActive) {
      return 'bg-gradient-to-br from-christmas-light to-christmas-dark';
    }
    
    if (!isMobile) return 'bg-gradient-to-r from-gray-300 to-gray-400';
    if (!trackRef.current) return 'bg-gradient-to-r from-gray-300 to-gray-400';
    
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 60;
    const maxDrag = trackRect.width - thumbWidth;
    const percentage = dragX / maxDrag;
    
    const gray = { r: 209, g: 213, b: 219 };
    const green = { r: 49, g: 162, b: 76 };
    
    const r = Math.round(gray.r + (green.r - gray.r) * percentage);
    const g = Math.round(gray.g + (green.g - gray.g) * percentage);
    const b = Math.round(gray.b + (green.b - gray.b) * percentage);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getBackgroundColor = (dragX, trackRef, isActive, isDragging) => {
    if (isActive && !isDragging) return null;
    if (!isMobile) return null;
    return getBackgroundStyle(dragX, trackRef, false);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">

      <ConfettiBurst 
        isActive={confettiTriggerId > 0} 
        triggerId={confettiTriggerId} // Pass the ID as the unique trigger
        originX={confettiOrigin.x} 
        originY={confettiOrigin.y}
        onComplete={handleConfettiComplete}
      />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <BackIcon size={24} color="#374151" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          Update Status
        </h3>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="text-center mb-12 text-xl sm:text-2xl font-bold text-gray-900">
          {gift.what}
        </h2>

        {/* Toggle Cards */}
        <div className="space-y-4 sm:space-y-6">
        

          {/* Written Toggle */}
          <div className={`bg-white rounded-2xl p-5 sm:p-6 shadow-md transition-all ${
            isWritten ? 'ring-2 ring-success' : 'border border-gray-200'
          }`}>
            {!isMobile ? (
              // Desktop layout
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900 mb-1">Written</h1>
                  <h2 className="text-sm text-gray-600">Toggle to mark as written</h2>
                </div>
                <button
                  onClick={handleWrittenToggle}
                  disabled={isUpdating}
                  className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                    isWritten ? 'bg-gradient-to-r from-christmas-light to-christmas-dark' : 'bg-gradient-to-r from-gray-300 to-gray-400'
                  } ${isUpdating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                    isWritten ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            ) : (
              // Mobile layout (draggable slider)
              <div 
                ref={writtenTrackRef}
                className={`w-full relative h-16 rounded-full overflow-hidden ${isWritten && !isDraggingWritten ? getBackgroundStyle(0, null, true) : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}
                style={{ 
                  backgroundColor: getBackgroundColor(writtenDragX, writtenTrackRef, isWritten, isDraggingWritten),
                  transition: isDraggingWritten ? 'none' : 'background-color 0.3s',
                  touchAction: "none"
                }}
                onPointerDown={handleWrittenPointerDown}
                onPointerMove={handleWrittenPointerMove}
                onPointerUp={handleWrittenPointerUp}
                onPointerCancel={handleWrittenPointerUp}
              >
                {isWritten && !isDraggingWritten && (
                  <div className="absolute inset-0 flex items-center pl-6 text-white font-bold text-lg">
                    Written!
                  </div>
                )}
                
                <div 
                  className="absolute top-2 h-12 w-12 bg-white rounded-full shadow-lg flex items-center justify-center"
                  style={{
                    left: isWritten && !isDraggingWritten ? 'calc(100% - 56px)' : `${writtenDragX + 8}px`,
                    transition: isDraggingWritten ? 'none' : 'left 0.3s'
                  }}
                >
                  <CheckIcon 
                    size={24} 
                    color={isWritten && !isDraggingWritten ? '#31A24C' : '#9CA3AF'} 
                  />
                </div>
                
                {!isWritten && !isDraggingWritten && (
                  <div className="absolute inset-0 flex items-center justify-end pr-6 text-white font-semibold text-sm">
                    Slide to mark as written
                  </div>
                )}
                {isWritten && isDraggingWritten && (
                  <div className="absolute inset-0 flex items-center justify-start pl-6 text-white font-semibold text-sm">
                    Slide to undo
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sent Toggle */}
          <div className={`bg-white rounded-2xl p-5 sm:p-6 shadow-md transition-all ${
            isSent ? 'ring-2 ring-success' : 'border border-gray-200'
          } ${!isWritten ? 'opacity-50' : ''}`}>
            {!isMobile ? (
              // Desktop layout
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900 mb-1">Sent</h1>
                  <h2 className="text-sm text-gray-600">Toggle to mark as sent</h2>
                </div>
                <button
                  onClick={handleSentToggle}
                  disabled={!isWritten || isUpdating}
                  className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                    isSent ? 'bg-gradient-to-r from-christmas-light to-christmas-dark' : 'bg-gradient-to-r from-gray-300 to-gray-400'
                  } ${isWritten && !isUpdating ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                    isSent ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            ) : (
              // Mobile layout (draggable slider)
              <div 
                ref={sentTrackRef}
                className={`w-full relative h-16 rounded-full overflow-hidden ${isSent && !isDraggingSent ? getBackgroundStyle(0, null, true) : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}
                style={{ 
                  backgroundColor: getBackgroundColor(sentDragX, sentTrackRef, isSent, isDraggingSent),
                  transition: isDraggingSent ? 'none' : 'background-color 0.3s',
                  touchAction: "none"
                }}
                onPointerDown={handleSentPointerDown}
                onPointerMove={handleSentPointerMove}
                onPointerUp={handleSentPointerUp}
                onPointerCancel={handleSentPointerUp}
              >
                {isSent && !isDraggingSent && (
                  <div className="absolute inset-0 flex items-center pl-6 text-white font-bold text-lg">
                    Sent!
                  </div>
                )}
                
                <div 
                  className="absolute top-2 h-12 w-12 bg-white rounded-full shadow-lg flex items-center justify-center"
                  style={{
                    left: isSent && !isDraggingSent ? 'calc(100% - 56px)' : `${sentDragX + 8}px`,
                    transition: isDraggingSent ? 'none' : 'left 0.3s'
                  }}
                >
                  <CheckIcon 
                    size={24} 
                    color={isSent && !isDraggingSent ? '#31A24C' : '#9CA3AF'} 
                  />
                </div>
                
                {!isSent && !isDraggingSent && (
                  <div className="absolute inset-0 flex items-center justify-end pr-6 text-white font-semibold text-sm">
                    {isWritten ? 'Slide to mark as sent' : 'Mark as written first'}
                  </div>
                )}
                {isSent && isDraggingSent && (
                  <div className="absolute inset-0 flex items-center justify-start pl-6 text-white font-semibold text-sm">
                    Slide to undo
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatusToggle;