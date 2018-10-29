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

  router.post('/mshp/corp/register', controller.mshp.corp_register);
  router.post('/mshp/corp/complete', controller.mshp.corp_complete);
  router.post('/mshp/corp/login', controller.mshp.corp_login);
  router.post('/mshp/user/register', controller.mshp.user_register);
  router.post('/mshp/user/enroll', controller.mshp.user_enroll);
  router.post('/mshp/user/login', controller.mshp.user_login);

};
