import { useState, useEffect, useCallback } from 'react';

interface NavigationState {
  activeTab: string;
  expandedItems: string[];
  scrollPosition: number;
}

export const useNavigationState = (defaultTab: string = 'overview') => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Preserve state in sessionStorage
  const saveState = useCallback(() => {
    const state: NavigationState = {
      activeTab,
      expandedItems,
      scrollPosition: window.scrollY
    };
    
    try {
      sessionStorage.setItem('favaron_navigation_state', JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save navigation state:', error);
    }
  }, [activeTab, expandedItems]);

  // Restore state from sessionStorage
  const restoreState = useCallback(() => {
    try {
      const saved = sessionStorage.getItem('favaron_navigation_state');
      if (saved) {
        const state: NavigationState = JSON.parse(saved);
        setActiveTab(state.activeTab || defaultTab);
        setExpandedItems(state.expandedItems || []);
        
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

  // Restore state on mount
  useEffect(() => {
    restoreState();
  }, []);

  const setActiveTabWithSave = useCallback((tab: string) => {
    setActiveTab(tab);
    // Clear expanded items when changing tabs
    setExpandedItems([]);
  }, []);

  const toggleExpandedItem = useCallback((itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  return {
    activeTab,
    setActiveTab: setActiveTabWithSave,
    expandedItems,
    toggleExpandedItem,
    saveState,
    restoreState
  };
};