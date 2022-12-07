// q@ts-nocheck
/* qeslint-disable */

import React from 'react';
import ReactDOM from 'react-dom';
import { setupReactAppOverlayErrorHandler } from 'react-app-error-boundary';
import logger from 'loglevel';
import App from './App';
import { Aarav } from './core/Aarav';

export default function render(aarav: Aarav) {
  let doRender = () => {
    ReactDOM.render(<App aarav={aarav} />, document.getElementById(aarav.rootElementId));
  };

  setupReactAppOverlayErrorHandler();

  const renderError = (error: Error) => {
    logger.error(error);
  };

  const renderApp = doRender;

  doRender = () => {
    try {
      renderApp();
    } catch (error: any) {
      renderError(error);
    }
  };

  doRender();
}
