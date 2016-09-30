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
import invariant from 'invariant';

const toTime = (hrtime) => (hrtime[0] + (hrtime[1] / Math.pow(10, 9)));
const diff = (one, two) => toTime(two) - toTime(one);

export default class DebugTimer {
  constructor(name) {
    this.name = name;
    this.times = [];
  }

  addTime(msg, time) {
    this.times.push({ msg, time });
  }

  log() {
    if (process.env.NODE_ENV === 'test') {
      console.log('\n' + this.name);
      this.times.forEach(obj => {
        const time = toTime(obj.time);
        const difference = diff(this.start, obj.time);
        console.log(`${difference} | ${time} | ${obj.msg}`);
      });
      console.log('\n');
    }
  }

  start(msg) {
    if (process.env.NODE_ENV === 'test') {
      this.start = process.hrtime();
      this.addTime(msg, this.start);
    }
  }

  time(msg) {
    if (process.env.NODE_ENV === 'test') {
      invariant(this.time, 'must have start()-ed');
      this.addTime(msg, process.hrtime());
    }
  }

  end(msg) {
    if (process.env.NODE_ENV === 'test') {
      invariant(this.time, 'must have start()-ed');
      this.addTime(msg, process.hrtime());
      this.log();
    }
  }
}