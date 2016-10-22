import register from './register';
import { isRegistered, onRegister, validRegion } from './clientRegistry';
import { callExtensionApi as api } from '../middleware/extensions';
import { projectFileWrite as write } from '../actions/projects';
import { projectFileRead as read, projectFileList as list } from '../selectors/projects';

/**
 * `window.constructor.extensions`
 *
 * API Section for extensions
 * @module extensions
 * @memberOf module:constructor
 */
export default {
  register,
  api,
  files: {
    read,
    write,
    list,
  },
  isRegistered,
  onRegister,
  validRegion,
};
