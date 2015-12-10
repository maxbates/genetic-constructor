import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { pushState } from 'redux-router';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import ConstructViewer from './graphics/views/constructviewer';
import Inventory from './Inventory';
import '../styles/SceneGraphPage.css';

/**
 * just for testing bootstrap, hence the lack of comments
 */
@DragDropContext(HTML5Backend)
class DnD extends Component {

  static propTypes = {
    project: PropTypes.object.isRequired,
    projectId: PropTypes.string.isRequired,
    children: PropTypes.object,
    constructs: PropTypes.array.isRequired,
  }

  constructor(props) {
    super(props);
    this.layoutAlgorithm = 'wrap';
  }

  onLayoutChanged = () => {
    this.layoutAlgorithm = this.refs.layoutSelector.value;
    this.forceUpdate();
  }

  render() {
    const { children, constructs } = this.props;

    const constructViewers = constructs.map(construct => {
      return <ConstructViewer key={construct.id} constructId={construct.id} layoutAlgorithm={this.layoutAlgorithm}/>;
    });

    return (
      <div className="ProjectPage">
        <Inventory />
        <div className="ProjectPage-content">
          <div style={{width:"400px",margin:"1rem 0 1rem 1rem"}}>
            <select ref="layoutSelector" onChange={this.onLayoutChanged}>
              <option value="wrap">Wrap</option>
              <option value="wrap-condensed">Wrap Condensed</option>
              <option value="full">Full</option>
              <option value="full-condensed">Full Condensed</option>
            </select>
          </div>
          {constructViewers}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { projectId, constructId } = state.router.params;
  const project = state.projects[projectId];
  const constructs = project.components.map(componentId => state.blocks[componentId]);

  return {
    projectId,
    constructId,
    project,
    constructs,
  };
}

export default connect(mapStateToProps, {
  pushState,
})(DnD);
