import React, { createContext, useContext, useEffect, useState } from 'react';
import { Advertisement } from '../types/advertisement';
import { advertisementService } from '../services/advertisementService';

interface AdvertisementContextType {
  advertisements: Advertisement[];
  loading: boolean;
  error: string | null;
  refreshAdvertisements: () => Promise<void>;
}

const AdvertisementContext = createContext<AdvertisementContextType | undefined>(undefined);

export const useAdvertisements = () => {
  const context = useContext(AdvertisementContext);
  if (!context) {
    throw new Error('useAdvertisements must be used within an AdvertisementProvider');
  }
  return context;
};

export const AdvertisementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      setError(null);
      const ads = await advertisementService.getActiveAdvertisements();
      setAdvertisements(ads);
    } catch (err) {
      console.error('Error fetching advertisements:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  return (
    <AdvertisementContext.Provider
      value={{
        advertisements,
        loading,
        error,
        refreshAdvertisements: fetchAdvertisements
      }}
    >
      {children}
    </AdvertisementContext.Provider>
  );
};

export default AdvertisementContext;
