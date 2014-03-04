module.exports.removeDashes = function(uuid) {
  if (uuid) {
    uuid = uuid.replace(/-/g, '');
  }

  return uuid;
};
