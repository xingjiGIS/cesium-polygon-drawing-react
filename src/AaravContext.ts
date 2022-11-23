import React from 'react';
import { AaravMapViewer } from './core/AaravMapViewer';
import { AaravViewer } from './core/AaravViewer';

export type AaravContextType = {
  aaravMapViewer: AaravMapViewer;
  aaravMainViewer: AaravViewer;
};

export default React.createContext<AaravContextType | null>(null);
