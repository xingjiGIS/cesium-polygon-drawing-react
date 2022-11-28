import React from 'react';
import { AaravViewer } from './core/AaravViewer';

export type AaravContextType = {
  aaravViewer: AaravViewer;
};

export default React.createContext<AaravContextType | null>(null);
