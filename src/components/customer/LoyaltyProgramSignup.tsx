import React from 'react';
import { Mail, Phone, AlertCircle, ExternalLink } from 'lucide-react';

interface LoyaltyProgramSignupProps {
  email?: string;
  phone?: string;
  marketingOptIn: boolean;
  termsAccepted: boolean;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onMarketingChange: (optIn: boolean) => void;
  onTermsChange: (accepted: boolean) => void;
  errors: Record<string, string>;
}

export function LoyaltyProgramSignup({
  email,
  phone,
  marketingOptIn,
  termsAccepted,
  onEmailChange,
  onPhoneChange,
  onMarketingChange,
  onTermsChange,
  errors
}: LoyaltyProgramSignupProps) {
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onPhoneChange(formatted);
  };

  return (
    <div className="mt-4 space-y-4 p-4 bg-white border border-purple-200 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-4">Complete Your Enrollment</h4>
      
      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={email || ''}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.loyaltyEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
            required
          />
        </div>
        {errors.loyaltyEmail && (
          <div className="mt-2 flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{errors.loyaltyEmail}</span>
          </div>
        )}
      </div>

      {/* Phone Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            value={phone || ''}
            onChange={handlePhoneChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.loyaltyPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="(555) 123-4567"
            maxLength={14}
            required
          />
        </div>
        {errors.loyaltyPhone && (
          <div className="mt-2 flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{errors.loyaltyPhone}</span>
          </div>
        )}
      </div>

      {/* Marketing Opt-in */}
      <div>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => onMarketingChange(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <div className="text-sm">
            <span className="text-gray-700">
              I'd like to receive promotional emails and SMS messages about special offers, new services, and exclusive member benefits.
            </span>
            <p className="text-xs text-gray-500 mt-1">
              You can unsubscribe at any time. Message and data rates may apply.
            </p>
          </div>
        </label>
      </div>

      {/* Terms and Conditions */}
      <div>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            required
          />
          <div className="text-sm">
            <span className="text-gray-700">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => window.open('/terms-loyalty', '_blank')}
                className="text-purple-600 hover:text-purple-700 underline inline-flex items-center"
              >
                Loyalty Program Terms & Conditions
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={() => window.open('/privacy', '_blank')}
                className="text-purple-600 hover:text-purple-700 underline inline-flex items-center"
              >
                Privacy Policy
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
              . *
            </span>
          </div>
        </label>
        {errors.loyaltyTerms && (
          <div className="mt-2 flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{errors.loyaltyTerms}</span>
          </div>
        )}
      </div>

      {/* Program Details */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
        <h5 className="font-medium text-purple-900 mb-2">How It Works:</h5>
        <ul className="text-xs text-purple-800 space-y-1">
          <li>• Earn 1 point for every $1 spent</li>
          <li>• Redeem 100 points for $10 off your next service</li>
          <li>• Get double points on your birthday month</li>
          <li>• Receive exclusive member pricing on select services</li>
        </ul>
      </div>
    </div>
  );
}