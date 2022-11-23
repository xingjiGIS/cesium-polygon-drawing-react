import React from 'react';
import './App.css';
import { Aarav } from './core/Aarav';
import AaravContext from './AaravContext';
import GUI from './components/GUI';

interface AppProps {
  aarav: Aarav;
}

const App = ({ aarav }: AppProps) => {
  let aaravMapViewer = aarav.mainViewer.aaravMapViewer;

  if (!aaravMapViewer) {
    aaravMapViewer = aarav.mainViewer.createAaravMapViewer();
  }

  const contextValue = {
    aaravMapViewer,
    aaravMainViewer: aarav.mainViewer,
  };

  return (
    <AaravContext.Provider value={contextValue}>
      <GUI />
    </AaravContext.Provider>
  );
};

export default App;
