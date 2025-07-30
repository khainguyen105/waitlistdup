import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

interface UseSecureActionOptions {
  requirePin?: boolean;
  action?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useSecureAction(options: UseSecureActionOptions = {}) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const { hasPermission, user } = useAuthStore();

  const executeSecureAction = (action: () => void, actionName?: string) => {
    const actionToCheck = actionName || options.action;
    
    // Check if user has permission for this action
    if (actionToCheck && !hasPermission(actionToCheck)) {
      options.onError?.('You do not have permission to perform this action.');
      return;
    }

    // Check if PIN verification is required
    const requiresPin = options.requirePin || 
      (actionToCheck && hasPermission(actionToCheck) && !user?.pinVerified);

    if (requiresPin) {
      setPendingAction(() => action);
      setShowPinModal(true);
    } else {
      // Execute action immediately
      try {
        action();
        options.onSuccess?.();
      } catch (error) {
        options.onError?.(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    
    if (pendingAction) {
      try {
        pendingAction();
        options.onSuccess?.();
      } catch (error) {
        options.onError?.(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setPendingAction(null);
      }
    }
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setPendingAction(null);
    options.onError?.('Action cancelled - PIN verification required');
  };

  return {
    executeSecureAction,
    showPinModal,
    handlePinSuccess,
    handlePinCancel,
    isActionPending: !!pendingAction,
  };
}