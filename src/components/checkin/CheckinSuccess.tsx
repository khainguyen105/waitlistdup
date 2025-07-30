import React from 'react';
import { CheckCircle, Clock, MapPin, Phone, Copy, Check } from 'lucide-react';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';

interface CheckinSuccessProps {
  checkinCode: string;
  checkinType: 'remote' | 'in_store';
  customerName: string;
  locationName: string;
  estimatedArrivalTime?: Date;
  onStartOver: () => void;
}

export function CheckinSuccess({
  checkinCode,
  checkinType,
  customerName,
  locationName,
  estimatedArrivalTime,
  onStartOver
}: CheckinSuccessProps) {
  const [copied, setCopied] = React.useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(checkinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {checkinType === 'remote' ? 'Pre-Check-In Complete!' : 'Check-In Complete!'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {checkinType === 'remote' 
            ? `Thanks ${customerName}! You're all set for your visit.`
            : `Welcome ${customerName}! You're checked in and ready.`
          }
        </p>

        {/* Check-in Code */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Your Check-in Code</p>
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-white border-2 border-gray-300 rounded-lg px-4 py-3">
              <span className="text-2xl font-bold text-gray-900 tracking-wider">{checkinCode}</span>
            </div>
            <TouchFriendlyButton
              variant="ghost"
              size="sm"
              onClick={copyCode}
              className="p-3"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </TouchFriendlyButton>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {checkinType === 'remote' 
              ? 'Show this code when you arrive'
              : 'Keep this code for your records'
            }
          </p>
        </div>

        {/* Location Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">{locationName}</span>
          </div>
          {estimatedArrivalTime && (
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Expected arrival: {estimatedArrivalTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="text-left mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">What's Next:</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {checkinType === 'remote' ? (
              <>
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                  <p>We'll send you SMS updates about your queue status</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Arrive within 15 minutes of your estimated time</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Show your check-in code to staff when you arrive</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-2">
                  <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                  <p>You'll be added to the queue shortly</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                  <p>We'll notify you when it's your turn</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Please stay in the waiting area</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>Call the store if you have any questions</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {checkinType === 'remote' && (
            <TouchFriendlyButton
              variant="outline"
              fullWidth
              onClick={() => window.open(`sms:?body=I've pre-checked in for ${locationName}. My code is ${checkinCode}`, '_blank')}
            >
              Share Check-in Details
            </TouchFriendlyButton>
          )}
          
          <TouchFriendlyButton
            variant="ghost"
            fullWidth
            onClick={onStartOver}
          >
            Check In Another Customer
          </TouchFriendlyButton>
        </div>

        {/* SMS Confirmation */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            📱 You'll receive SMS confirmations and updates at your provided phone number
          </p>
        </div>
      </div>
    </div>
  );
}