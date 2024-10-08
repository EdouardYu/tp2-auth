const AccessControl = require('accesscontrol');
const ac = new AccessControl();

ac.grant('user')
    .readOwn('profile')
    .updateOwn('profile');

ac.grant('admin')
    .extend('user')
    .updateAny('profile')
    .deleteAny('profile');

module.exports = { ac };

