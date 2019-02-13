'use strict';

module.exports = () => {
  const config = exports = {};

  // wxapi config
  config.wxapi = {
    appid: 'wx0a4d3e220354c906', // 微信公众号APPID
    baseUrl: 'http://oa.chinahuian.cn', // 微信网关地址
  };

  // 服务器发布路径
  config.baseUrl = '/weixin';
  // 认证回调地址
  config.authUrl = `${config.baseUrl}/auth`;

  // mongoose config
  config.mongoose = {
    url: 'mongodb://192.168.18.100:27018/platform',
  };

  // redis config
  config.redis = {
    client: {
      host: '192.168.18.100', // Redis host
    },
  };

  // mq config
  config.amqp = {
    client: {
      hostname: '192.168.18.100',
      // hostname: '192.168.1.190',
    },
  };

  config.logger = {
    level: 'DEBUG',
    consoleLevel: 'DEBUG',
  };

  return config;
};
