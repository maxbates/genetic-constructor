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

import '../../../src/styles/sequence-editor.css';

export default class SequenceEditor {

  constructor(props) {
    Object.assign(this, {

    }, props);
  }

  dispose() {
  }

  update() {
    this.parent.innerHTML = new Date().toString();
  }
}
/*
  1           ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
  41          ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
  81          ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
 */
