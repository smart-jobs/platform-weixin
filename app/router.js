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

  // 微信认证，生成包含微信用户信息的token写入cookie
  router.get('/auth', controller.weixin.auth);

  // 微信扫码登录，生成包含微信用户信息的token，存入redis
  router.post('/qrcode/create', controller.qrcode.create); // 创建二维码
  router.post('/qrcode/:qrcode/check', controller.qrcode.check); // 检查二维码状态
  router.get('/qrcode/:qrcode/scan', controller.qrcode.scan); // 扫码确认页面
  router.post('/qrcode/:qrcode/login', controller.qrcode.login); // 扫码登录确认
  router.post('/qrcode/:qrcode/token', controller.qrcode.token); // 换取微信认证码

  router.post('/api/login', controller.mshp.weixin_login); // 获得绑定用户信息和凭证
  router.post('/api/corp/login', controller.mshp.corp_login); // 企业用户登录绑定
  router.post('/api/corp/create_user', controller.mshp.corp_createUser); // 创建企业用户，返回无企业信息的登录凭证
  router.post('/api/corp/register', controller.mshp.corp_register); // 企业用户创建企业，返回包含企业信息的登录凭证
  router.post('/api/user/login', controller.mshp.user_login); // 学生用户登录绑定
  router.post('/api/user/create', controller.mshp.user_create); // 创建学生用户，返回用户信息和登录凭证
  router.post('/api/user/register', controller.mshp.user_register); // 创建学生用户，返回用户信息和登录凭证

};
