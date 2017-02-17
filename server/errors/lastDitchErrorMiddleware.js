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

//last ditch error handler, should be mounted as last middleware
export default function generalErrorHandler(err, req, res, next) {
  console.log('unhandled server error @ url: ', req.originalUrl);
  console.error(err);
  console.error(err.stack);

  //only want a string, dont leak to client
  const message = typeof err === 'string' ? err : err.message;
  return res.status(500).send(message);
}
