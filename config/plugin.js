'use strict';

// had enabled by egg
// exports.static = true;

exports.amqp = {
  enable: true,
  package: 'egg-naf-amqp',
};

exports.redis = {
  enable: true,
  package: 'egg-redis',
};

exports.nunjucks = {
  enable: true,
  package: 'egg-view-nunjucks',
};
