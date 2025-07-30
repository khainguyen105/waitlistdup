import React from 'react';
import { PinVerificationModal } from './PinVerificationModal';
import { useSecureAction } from '../../hooks/useSecureAction';
import { useLocationStore } from '../../stores/locationStore';

interface ProtectedActionProps {
  children: React.ReactElement;
  action: string;
  requirePin?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function ProtectedAction({
  children,
  action,
  requirePin = false,
  onSuccess,
  onError
}: ProtectedActionProps) {
  const { selectedLocation } = useLocationStore();
  
  const {
    executeSecureAction,
    showPinModal,
    handlePinSuccess,
    handlePinCancel
  } = useSecureAction({
    requirePin,
    action,
    onSuccess,
    onError
  });

  const handleClick = (originalOnClick?: () => void) => {
    executeSecureAction(() => {
      originalOnClick?.();
    }, action);
  };

  // Clone the child element and override its onClick handler
  const protectedChild = React.cloneElement(children, {
    onClick: () => handleClick(children.props.onClick)
  });

  return (
    <>
      {protectedChild}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={handlePinCancel}
        onSuccess={handlePinSuccess}
        locationId={selectedLocation?.id || ''}
        title="Action Verification"
        description="Please enter your PIN to continue with this action"
      />
    </>
  );
}