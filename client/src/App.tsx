import React, { useEffect, useState } from 'react';
import './App.css';
import ImageUpload from './components/ImageUpload/ImageUpload';
import { UserProvider } from './context/UserContext';

function App() {
  // This simulates a demo login - in a real app this would be proper auth
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Simulate initializing a demo user
    const initDemoUser = () => {
      const existingUser = localStorage.getItem('user');
      
      if (!existingUser) {
        // Create a demo user if none exists
        const demoUser = {
          id: `demo-${Date.now()}`,
          name: 'Demo User',
        };
        
        localStorage.setItem('user', JSON.stringify(demoUser));
      }
      
      setIsInitialized(true);
    };
    
    initDemoUser();
  }, []);

  if (!isInitialized) {
    return <div className="loading">Initializing application...</div>;
  }

  return (
    <UserProvider>
      <div className="App">
        <ImageUpload />
      </div>
    </UserProvider>
  );
}

export default App;