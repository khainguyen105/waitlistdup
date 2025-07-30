import React, { useState } from 'react';
import { CheckCircle, Star, Gift, Calendar, Info, X, Loader2 } from 'lucide-react';
import { ServiceRating } from './ServiceRating';
import { BirthdayField } from './BirthdayField';
import { LoyaltyProgramSignup } from './LoyaltyProgramSignup';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';

interface ThankYouPageProps {
  customerName: string;
  services: string[];
  locationName: string;
  onComplete: () => void;
}

interface FormData {
  rating?: number;
  feedback?: string;
  birthday?: Date;
  joinLoyalty: boolean;
  loyaltyEmail?: string;
  loyaltyPhone?: string;
  loyaltyMarketing: boolean;
  loyaltyTerms: boolean;
}

export function ThankYouPage({ 
  customerName, 
  services, 
  locationName, 
  onComplete 
}: ThankYouPageProps) {
  const [currentStep, setCurrentStep] = useState<'rating' | 'details' | 'complete'>('rating');
  const [formData, setFormData] = useState<FormData>({
    joinLoyalty: false,
    loyaltyMarketing: false,
    loyaltyTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRatingModal, setShowRatingModal] = useState(true);

  const handleRatingSubmit = (rating: number, feedback?: string) => {
    setFormData(prev => ({ ...prev, rating, feedback }));
    setShowRatingModal(false);
    setCurrentStep('details');
  };

  const handleSkipRating = () => {
    setShowRatingModal(false);
    setCurrentStep('details');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Birthday validation (must be at least 13 years old)
    if (formData.birthday) {
      const today = new Date();
      const birthDate = new Date(formData.birthday);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 13) {
        newErrors.birthday = 'You must be at least 13 years old to provide your birthday.';
      }
    }

    // Loyalty program validation
    if (formData.joinLoyalty) {
      if (!formData.loyaltyEmail) {
        newErrors.loyaltyEmail = 'Email is required for loyalty program enrollment.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.loyaltyEmail)) {
        newErrors.loyaltyEmail = 'Please enter a valid email address.';
      }

      if (!formData.loyaltyPhone) {
        newErrors.loyaltyPhone = 'Phone number is required for loyalty program enrollment.';
      }

      if (!formData.loyaltyTerms) {
        newErrors.loyaltyTerms = 'You must accept the terms and conditions to join the loyalty program.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would typically send the data to your backend
      console.log('Submitting thank you form:', {
        customerName,
        services,
        locationName,
        ...formData
      });

      setCurrentStep('complete');
    } catch (error) {
      console.error('Failed to submit form:', error);
      setErrors({ submit: 'Failed to save your information. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">All Set!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for taking the time to share your feedback and information with us.
          </p>

          {formData.joinLoyalty && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Welcome to our Loyalty Program!</span>
              </div>
              <p className="text-sm text-blue-800">
                You'll receive a welcome email with your member benefits and first reward.
              </p>
            </div>
          )}

          <TouchFriendlyButton
            onClick={handleComplete}
            fullWidth
            className="mb-4"
          >
            Continue
          </TouchFriendlyButton>

          <p className="text-xs text-gray-500">
            We look forward to seeing you again soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 text-lg">Your service is complete at {locationName}</p>
        </div>

        {currentStep === 'details' && (
          <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Thanks for visiting, {customerName}!
              </h2>
              <p className="text-gray-600 mb-4">
                We'd love to learn more about you to provide an even better experience next time.
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {services.map((service, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {/* Birthday Field */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <label className="text-lg font-semibold text-gray-900">
                    Birthday (Optional)
                  </label>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      We collect birthdays to send you special offers and celebrate with you!
                    </div>
                  </div>
                </div>
                <BirthdayField
                  value={formData.birthday}
                  onChange={(date) => setFormData(prev => ({ ...prev, birthday: date }))}
                  error={errors.birthday}
                />
              </div>

              {/* Loyalty Program */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Join Our Loyalty Program</h3>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Member Benefits:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Earn points with every visit</li>
                    <li>• Get 10% off your 5th service</li>
                    <li>• Exclusive member-only promotions</li>
                    <li>• Priority booking for popular time slots</li>
                    <li>• Birthday month special offers</li>
                  </ul>
                </div>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.joinLoyalty}
                    onChange={(e) => setFormData(prev => ({ ...prev, joinLoyalty: e.target.checked }))}
                    className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">
                    Yes, I'd like to join the loyalty program and start earning rewards!
                  </span>
                </label>

                {formData.joinLoyalty && (
                  <LoyaltyProgramSignup
                    email={formData.loyaltyEmail}
                    phone={formData.loyaltyPhone}
                    marketingOptIn={formData.loyaltyMarketing}
                    termsAccepted={formData.loyaltyTerms}
                    onEmailChange={(email) => setFormData(prev => ({ ...prev, loyaltyEmail: email }))}
                    onPhoneChange={(phone) => setFormData(prev => ({ ...prev, loyaltyPhone: phone }))}
                    onMarketingChange={(optIn) => setFormData(prev => ({ ...prev, loyaltyMarketing: optIn }))}
                    onTermsChange={(accepted) => setFormData(prev => ({ ...prev, loyaltyTerms: accepted }))}
                    errors={errors}
                  />
                )}
              </div>

              {/* Error Messages */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <TouchFriendlyButton
                  variant="outline"
                  onClick={handleComplete}
                  fullWidth
                  className="sm:flex-1"
                >
                  Skip & Continue
                </TouchFriendlyButton>
                <TouchFriendlyButton
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  fullWidth
                  className="sm:flex-1"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Continue'}
                </TouchFriendlyButton>
              </div>
            </div>
          </div>
        )}

        {/* Service Rating Modal */}
        <ServiceRating
          isOpen={showRatingModal}
          onClose={handleSkipRating}
          customerName={customerName}
          services={services}
          locationName={locationName}
          onSubmitRating={handleRatingSubmit}
        />
      </div>
    </div>
  );
}