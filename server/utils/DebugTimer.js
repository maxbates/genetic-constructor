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
const toReadable = (float) => {
  const precision = 6;
  return String(float).substr(0, precision + 2);
};

const realtime = process.env.DEBUG === 'realtime';

export default class DebugTimer {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options; //disabled, condition, delayed
    this.times = [];

    if (options.delayed !== true) {
      this.start('init');
    }
  }

  //private
  addTime(msg, time) {
    this.times.push({ msg, time });
    if (this.shouldLog() && realtime && this.times.length > 1) {
      const prev = this.times[this.times.length - 2].time;
      const difference = toReadable(diff(prev, time));
      console.log(`${difference}\t${msg}\t(${this.name})`);
    }
  }

  shouldLog() {
    const disabled = this.options.disabled === true;
    const cond = typeof this.options.condition === 'function' ? this.options.condition() : this.options.condition !== false;
    return process.env.DEBUG && !disabled && cond;
  }

  log() {
    if (process.env.DEBUG) {
      if (this.shouldLog() && !realtime) {
        console.log('\n' + this.name);
        //console.log('Diff Last | Diff Start | Message');
        this.times.forEach((obj, index) => {
          if (index === 0) {
            return;
          }
          const last = index > 0 ? this.times[index - 1].time : this.start;
          const diffLast = toReadable(diff(last, obj.time));
          const diffStart = toReadable(diff(this.start, obj.time));
          console.log(`${diffLast}\t${diffStart}\t${obj.msg}`);
        });
      }
    }
  }

  clear() {
    this.times.length = 0;
  }

  //run by constructor
  start(msg) {
    if (process.env.DEBUG) {
      this.start = process.hrtime();
      this.addTime(msg, this.start);
    }
  }

  time(msg) {
    if (process.env.DEBUG) {
      invariant(this.time, 'must have start()-ed');
      this.addTime(msg, process.hrtime());
    }
  }

  end(msg = 'complete') {
    if (process.env.DEBUG) {
      invariant(this.time, 'must have start()-ed');
      this.addTime(msg, process.hrtime());
      if (!realtime) {
        this.log();
      }
      this.clear();
    }
  }
}
