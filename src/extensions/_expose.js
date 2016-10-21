import register from './register';
import { isRegistered, onRegister, validRegion } from './clientRegistry';
import { callExtensionApi as api } from '../middleware/extensions';
import { projectFileRead as read, projectFileWrite as write, projectFileList as list } from '../middleware/projectFiles';

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
