import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface ModalState {
  id: string;
  type: string;
  data?: any;
  isOpen: boolean;
}

interface ModalStateContextType {
  modals: ModalState[];
  openModal: (id: string, type: string, data?: any) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  hasOpenModals: () => boolean;
  getModalData: (id: string) => any;
}

const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);

const MODAL_STORAGE_KEY = 'faveron_modal_state';

export const ModalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modals, setModals] = useState<ModalState[]>(() => {
    // Restore modal state from sessionStorage
    try {
      const stored = sessionStorage.getItem(MODAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist modal state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(MODAL_STORAGE_KEY, JSON.stringify(modals));
    } catch (error) {
      console.warn('Failed to persist modal state:', error);
    }
  }, [modals]);

  const openModal = useCallback((id: string, type: string, data?: any) => {
    setModals(prev => {
      const existing = prev.find(modal => modal.id === id);
      if (existing) {
        return prev.map(modal => 
          modal.id === id 
            ? { ...modal, isOpen: true, data, type }
            : modal
        );
      }
      return [...prev, { id, type, data, isOpen: true }];
    });
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return modals.some(modal => modal.id === id && modal.isOpen);
  }, [modals]);

  const hasOpenModals = useCallback(() => {
    return modals.some(modal => modal.isOpen);
  }, [modals]);

  const getModalData = useCallback((id: string) => {
    return modals.find(modal => modal.id === id)?.data;
  }, [modals]);

  return (
    <ModalStateContext.Provider value={{
      modals,
      openModal,
      closeModal,
      isModalOpen,
      hasOpenModals,
      getModalData
    }}>
      {children}
    </ModalStateContext.Provider>
  );
};

export const useModalState = () => {
  const context = useContext(ModalStateContext);
  if (!context) {
    throw new Error('useModalState must be used within a ModalStateProvider');
  }
  return context;
};