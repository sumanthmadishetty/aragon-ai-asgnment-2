import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Types
interface User {
  id: string;
  name?: string;
  email?: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provide a hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Props for UserProvider
interface UserProviderProps {
  children: ReactNode;
}

// User Provider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          console.log('User loaded from localStorage:', JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse user from localStorage', error);
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Compute if the user is authenticated
  const isAuthenticated = !!user;

  // Context value
  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;