import React, { useMemo } from 'react';
import './App.css';
import { Aarav } from './core/Aarav';
import AaravContext from './AaravContext';
import GUI from './components/GUI';

interface AppProps {
  aarav: Aarav;
}

const App = ({ aarav }: AppProps) => {
  const aaravViewer = aarav.aaravViewer;
  let viewer = aaravViewer.cesiumViewer;
  if (!viewer) {
    viewer = aaravViewer.createCesiumViewer();
  }

  const contextValue = useMemo(() => ({ viewer, aaravViewer }), [viewer, aaravViewer]);
  return (
    <AaravContext.Provider value={contextValue}>
      <GUI />
    </AaravContext.Provider>
  );
};

export default App;
