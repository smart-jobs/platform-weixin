'use strict';

module.exports = () => {
  const config = exports = {};

  // 服务器发布路径
  config.baseUrl = '/weixin';
  // 认证回调地址
  config.authUrl = '/weixin/auth';

  // wxapi config
  // config.wxapi = {
  //   appid: 'wx0a4d3e220354c906', // 微信公众号APPID
  //   baseUrl: 'http://oa.chinahuian.cn', // 微信网关地址
  // };
  config.wxapi = {
    appid: 'wxd2e28415cb866c0b', // 微信公众号APPID
    baseUrl: 'http://www.jilinjobswx.cn', // 微信网关地址
  };

  // mongoose config
  config.mongoose = {
    url: 'mongodb://localhost:27018/platform',
    options: {
      user: 'root',
      pass: 'Ziyouyanfa#@!',
      authSource: 'admin',
      useNewUrlParser: true,
      useCreateIndex: true,
    },
  };

  // mq config
  config.amqp = {
    client: {
      hostname: '192.168.1.190',
    },
  };

  config.logger = {
    // level: 'DEBUG',
    // consoleLevel: 'DEBUG',
  };

  return config;
};
