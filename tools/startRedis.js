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

import colors from 'colors/safe';
import { spawnAsync } from './lib/cp';
import checkPortFree from '../server/utils/checkPortFree';
import { REDIS_PORT } from '../server/urlConstants';

//note - DB holds on the to process, so this will resolve but process will never exit. So, can be used in promise chaining, but not in __ && __ bash syntax

//todo - install redis as part of installation? or just use amazon elasticCache
//todo - redis conf

/*
 local: but probably want something better:

 wget http://download.redis.io/redis-stable.tar.gz
 tar xvzf redis-stable.tar.gz
 cd redis-stable
 make
 make install
 */

console.log('\nTODO - INSTALL REDIS \n');

async function startRedis() {
  try {
    const dbProcess = await checkPortFree(REDIS_PORT)
    .catch(err => false)
    .then((free) => {
      if (free) {
        return spawnAsync('redis-server', ['--port', REDIS_PORT], {}, {
          waitUntil: 'The server is now ready to accept connections',
          comment: 'Starting redis server...',
        });
      }

      //if not free
      console.log(colors.yellow('Redis port not free, assuming Redis is running...'));
      return null;
    });

    console.log('Redis running on port:', REDIS_PORT);
    return dbProcess;
  } catch (err) {
    console.log(colors.red('Error starting Redis (is redis installed?)...'));
    throw err;
  }
}

export default startRedis;
