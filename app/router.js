'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/demo', controller.home.demo);
  router.get('/info', controller.home.info);
  router.get('/test', controller.home.test);

  router.get('/auth', controller.auth.auth);
  router.get('/fetch', controller.auth.fetch);

};
