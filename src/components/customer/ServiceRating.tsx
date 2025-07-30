import React, { useState } from 'react';
import { Star, ThumbsUp, MessageCircle, X, Loader2 } from 'lucide-react';

interface ServiceRatingProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  services: string[];
  locationName: string;
  onSubmitRating: (rating: number, feedback?: string) => void;
}

export function ServiceRating({ 
  isOpen, 
  onClose, 
  customerName, 
  services, 
  locationName,
  onSubmitRating 
}: ServiceRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Simulate API call with potential failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 10% failure rate for demonstration
          if (Math.random() < 0.1) {
            reject(new Error('Network error'));
          } else {
            resolve(true);
          }
        }, 1000);
      });
      
      onSubmitRating(rating, feedback || undefined);
      
      // Auto-close modal with smooth animation
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      setSubmitError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "We're sorry to hear that. We'll work to improve.";
      case 2: return "Thank you for the feedback. We'll do better next time.";
      case 3: return "Thanks for your feedback. We appreciate it!";
      case 4: return "Great! We're glad you had a good experience.";
      case 5: return "Excellent! Thank you for the amazing review!";
      default: return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Thank You!</h2>
                <p className="text-sm text-gray-600">Your service is complete</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Close rating modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hi {customerName}!
            </h3>
            <p className="text-gray-600 mb-1">
              Thank you for visiting {locationName}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {services.map((service, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                How was your experience today?
              </label>
              <div className="flex justify-center space-x-2" role="radiogroup" aria-label="Service rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    role="radio"
                    aria-checked={rating === star}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors duration-200 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-600 mt-3 animate-fade-in">
                  {getRatingText(rating)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Additional feedback (optional)</span>
                </div>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Tell us more about your experience..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {feedback.length}/500 characters
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}