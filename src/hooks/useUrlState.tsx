import { useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const useUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const setUrlParam = useCallback((key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const getUrlParam = useCallback((key: string) => {
    return searchParams.get(key);
  }, [searchParams]);

  const navigateToTab = useCallback((tab: string) => {
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  }, [navigate]);

  const navigateToProfile = useCallback(() => {
    navigate('/dashboard?tab=profile', { replace: true });
  }, [navigate]);

  const navigateToForm = useCallback((formType: 'package' | 'trip') => {
    navigate(`/dashboard/${formType}`, { replace: true });
  }, [navigate]);

  const navigateBack = useCallback(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return {
    searchParams,
    setUrlParam,
    getUrlParam,
    navigateToTab,
    navigateToProfile,
    navigateToForm,
    navigateBack
  };
};