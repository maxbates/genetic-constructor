/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import React, { PropTypes } from 'react';
import UserWidget from '../authentication/userwidget';
import AutosaveTracking from '../GlobalNav/autosaveTracking';

const InspectorRightNav = ({ currentProjectId, isVisible }) => {
  let autoSave;
  if (currentProjectId && isVisible) {
    autoSave = <AutosaveTracking projectId={currentProjectId} />;
  }
  return (
    <div className="right-nav" >
      <UserWidget />
      {autoSave}
    </div>
  );
};

InspectorRightNav.propTypes = {
  currentProjectId: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
};

export default InspectorRightNav;

