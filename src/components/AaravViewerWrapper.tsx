import React from 'react';
import { AaravViewer } from '../core/AaravViewer';

type AaravViewerWrapperProps = {
  aaravViewer: AaravViewer;
};

/**
 * Attach cesium viewer to html element
 */
class AaravViewerWrapper extends React.Component<AaravViewerWrapperProps> {
  componentWillUnmount() {
    const { aaravViewer } = this.props;

    if (aaravViewer.attached) {
      aaravViewer.detach();
    }
  }

  /**
   * @argument {HTMLDivElement} container
   */
  containerRef = (container: HTMLDivElement | null) => {
    const { aaravViewer } = this.props;

    if (aaravViewer.attached) {
      aaravViewer.detach();
    }

    if (container !== null) {
      aaravViewer.attach(container);
    }
  };

  render() {
    return <div id="cesiumContainer" ref={this.containerRef} />;
  }
}

export default AaravViewerWrapper;
