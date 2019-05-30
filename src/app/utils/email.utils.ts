'use strict';

exports.sanitizeEmail = function(email){
  if (email) {
    // var domain = email.replace(/.*@/, '');
    // var username = email.substring(0, email.indexOf('@'));
    return email;
  }
  return;
};
