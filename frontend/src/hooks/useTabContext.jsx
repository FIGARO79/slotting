import { useState } from 'react';

export const useTabContext = () => {
  const [title, setTitle] = useState('');
  
  return {
    title,
    setTitle: (newTitle) => {
      console.log('Setting title to:', newTitle);
      setTitle(newTitle);
    }
  };
};
