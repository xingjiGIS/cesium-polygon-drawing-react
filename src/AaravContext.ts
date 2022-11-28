import { Viewer } from 'cesium';
import React from 'react';
import { AaravViewer } from './core/AaravViewer';

export type AaravContextType = {
  aaravMapViewer: Viewer | undefined;
  aaravMainViewer: AaravViewer;
};

export default React.createContext<AaravContextType | null>(null);
