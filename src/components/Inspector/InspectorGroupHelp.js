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
import React, { Component } from 'react';

import '../../styles/InspectorGroupHelp.css';

export default class InspectorGroupHelp extends Component {

  render() {
    return (<div className="InspectorGroupHelp">
      <div className="Section">Using Genetic Constructor</div>
      <a target="_blank" href="https://geneticconstructor.readme.io/docs">Getting Started</a>
      <a target="_blank" href="https://geneticconstructor.readme.io/docs/creating-your-first-constructs">Tutorial</a>
      <a target="_blank" href="https://geneticconstructor.readme.io/docs/edinburgh-genome-foundry">Ordering DNA</a>
      <a target="_blank" href="https://geneticconstructor.readme.io/docs/keyboard-shortcuts">Keyboard Shortcuts</a>
      <a target="_blank" href="https://geneticconstructor.readme.io/blog">More...</a>
      <br/>
      <div className="Section">Help for Plugins</div>
      <a target="_blank" href="https://geneticconstructor.readme.io/docs/genotype-specification-language">GSL Editor</a>
      <a target="_blank" href="https://geneticconstructor.readme.io/docs/edinburgh-genome-foundry">Edinburgh Genome Foundry</a>
      <br/>
      <div className="Section">Information for Developers</div>
      <a target="_blank" href="https://geneticconstructor.readme.io/docs/how-to-contribute">Contributing to</a>
      <a target="_blank" href="https://geneticconstructor.readme.io/docs/about-extensions">Authoring Plugins</a>
      <a target="_blank" href="https://github.com/Autodesk/genetic-constructor">API Documentation</a>
      <br/>
      <div className="Section">Get Support</div>
      <a target="_blank" href="https://geneticconstructor.readme.io/discuss">Community Discussions</a>
      <a href="#">Report a Bug</a>
      <a href="#">Give us Feedback</a>
      <br/>
      <div className="Section">Information</div>
      <a href="#">About Genetic Constructor</a>
      <a href="#">Terms of Use</a>
      <a href="#">Privacy Policy</a>
      <a target="_blank" href="http://bionano.autodesk.com/">More from Autodesk® BioNano Research</a>
    </div>);
  }
}

