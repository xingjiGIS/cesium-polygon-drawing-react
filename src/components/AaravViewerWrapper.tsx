import React from 'react';
import { AaravViewer } from '../core/AaravViewer';

type AaravViewerWrapperProps = {
  aaravMainViewer: AaravViewer;
};

/**
 * Attach cesium viewer to html element
 */
class AaravViewerWrapper extends React.Component<AaravViewerWrapperProps> {
  componentWillUnmount() {
    const { aaravMainViewer } = this.props;

    const aaravViewer = aaravMainViewer;

    if (aaravViewer.attached) {
      aaravViewer.detach();
    }
  }

  /**
   * @argument {HTMLDivElement} container
   */
  containerRef = (container: HTMLDivElement | null) => {
    const { aaravMainViewer } = this.props;

    const aaravViewer = aaravMainViewer;

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
