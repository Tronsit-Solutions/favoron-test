import { useState, useEffect, useCallback } from 'react';

interface NavigationState {
  activeTab: string;
  expandedItems: string[];
  scrollPosition: number;
  openModals: string[];
  formStates: Record<string, any>;
}

export const useNavigationState = (defaultTab: string = 'overview') => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [openModals, setOpenModals] = useState<string[]>([]);
  const [formStates, setFormStates] = useState<Record<string, any>>({});

  // Save state to sessionStorage to persist across tab switches
  const saveState = useCallback(() => {
    const state: NavigationState = {
      activeTab,
      expandedItems,
      scrollPosition: window.scrollY,
      openModals,
      formStates
    };
    
    try {
      sessionStorage.setItem('favaron_navigation_state', JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save navigation state:', error);
    }
  }, [activeTab, expandedItems, openModals, formStates]);

  // Restore state from sessionStorage
  const restoreState = useCallback(() => {
    try {
      const saved = sessionStorage.getItem('favaron_navigation_state');
      if (saved) {
        const state: NavigationState = JSON.parse(saved);
        setActiveTab(state.activeTab || defaultTab);
        setExpandedItems(state.expandedItems || []);
        setOpenModals(state.openModals || []);
        setFormStates(state.formStates || {});
        
        // Restore scroll position after a brief delay
        setTimeout(() => {
          window.scrollTo(0, state.scrollPosition || 0);
        }, 100);
      }
    } catch (error) {
      console.warn('Could not restore navigation state:', error);
    }
  }, [defaultTab]);

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [saveState]);

  // Restore state on mount only (no visibility change listener)
  useEffect(() => {
    restoreState();
  }, [restoreState]);

  const setActiveTabWithSave = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const toggleExpandedItem = useCallback((itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const openModal = useCallback((modalId: string) => {
    setOpenModals(prev => [...prev.filter(id => id !== modalId), modalId]);
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setOpenModals(prev => prev.filter(id => id !== modalId));
  }, []);

  const saveFormState = useCallback((formId: string, state: any) => {
    setFormStates(prev => ({ ...prev, [formId]: state }));
  }, []);

  const getFormState = useCallback((formId: string) => {
    return formStates[formId];
  }, [formStates]);

  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem('favaron_navigation_state');
      setActiveTab(defaultTab);
      setExpandedItems([]);
      setOpenModals([]);
      setFormStates({});
    } catch (error) {
      console.warn('Could not clear navigation state:', error);
    }
  }, [defaultTab]);

  return {
    activeTab,
    setActiveTab: setActiveTabWithSave,
    expandedItems,
    toggleExpandedItem,
    openModals,
    openModal,
    closeModal,
    saveFormState,
    getFormState,
    clearState,
    saveState,
    restoreState
  };
};