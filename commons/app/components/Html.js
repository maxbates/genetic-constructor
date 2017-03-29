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
import { analytics } from '../../config';

export default class Html extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    author: PropTypes.string,
    keywords: PropTypes.string,
    //styles: PropTypes.arrayOf(PropTypes.string.isRequired),
    scripts: PropTypes.arrayOf(PropTypes.string.isRequired),
    state: PropTypes.object,
    children: PropTypes.string.isRequired,
  };

  static defaultProps = {
    title: 'Genetic Constructor - Commons',
    description: 'Genetic Constructor Commons hosts published projects and constructs from users.',
    author: 'Autodesk Life Sciences',
    keywords: 'genetic design software, genetic design tool, dna sequence editor, molecular design software, promoter library, CAD software for biology',
    state: {},
    //styles: ['/static/commons.css'],
    scripts: ['/static/commons.js'], //todo - compute from webpack
  };

  render() {
    const { title, description, author, keywords, scripts, state, children } = this.props;

    //lame security handling
    const stateString = JSON.stringify(state).replace(/</g, '\\u003c');

    return (
      <html className="no-js" lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta name="author" content={author} />
          <meta name="keywords" content={keywords} />
          <link rel="canonical" href="https://geneticconstructor.bionano.autodesk.com" />
          <link rel="stylesheet" href="/static/commons.css" />
        </head>

        <body>
          <div
            id="root"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: children }}
          />

          {state && (
            <script
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `window.__PRELOADED_STATE__ = ${stateString}`,
              }}
            />
          )}

          {scripts.map(file => (<script key={file} src={file} />))}

          {analytics.google.trackingId &&
            <script
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: 'window.ga=function(){ga.q.push(arguments)};ga.q=[];ga.l=+new Date;' +
            `ga('create','${analytics.google.trackingId}','auto');ga('send','pageview')`,
              }}
            />
          }
          {analytics.google.trackingId &&
            (<script src="https://www.google-analytics.com/analytics.js" async defer />)
          }
        </body>
      </html>
    );
  }
}
