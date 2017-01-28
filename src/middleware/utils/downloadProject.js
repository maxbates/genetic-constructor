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
import { extensionApiPath } from './paths';

export default function downloadProject(projectId, options) {
  const url = extensionApiPath('genbank', `export/${projectId}`);
  const postBody = options;
  const iframeTarget = `${Math.floor(Math.random() * 10000)}${+Date.now()}`;

  // for now use an iframe otherwise any errors will corrupt the page
  const iframe = document.createElement('iframe');
  iframe.name = iframeTarget;
  iframe.style.display = 'none';
  iframe.src = '';
  document.body.appendChild(iframe);

  //make form to post to iframe
  const form = document.createElement('form');
  form.style.display = 'none';
  form.action = url;
  form.method = 'post';
  form.target = iframeTarget;

  //add inputs to the form for each value in postBody
  Object.keys(postBody).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = postBody[key];
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();

  //removing elements will cancel, so give them a nice timeout
  setTimeout(() => {
    document.body.removeChild(form);
    document.body.removeChild(iframe);
  }, 60 * 1000);
}

