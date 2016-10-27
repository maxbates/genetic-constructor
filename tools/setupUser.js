import { defaultUser } from '../server/auth/local';
import checkUserSetup from '../server/onboarding/userSetup';

/*
When developing locally, set up a project for the default user.
This is the same project that is included in new user's accounts.
Only need to run this once.
 */

async function setupUser() {
  await checkUserSetup(defaultUser);
}

export default setupUser;
