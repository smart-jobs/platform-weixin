'use strict';

module.exports = () => {
  const config = exports = {};

  // 认证回调地址
  config.authUrl = '/auth', 
  // wxapi config
  config.wxapi = {
    appid: 'wx0a4d3e220354c906', // 微信公众号APPID
    baseUrl: 'http://oa.chinahuian.cn', // 微信网关地址
  };

  config.logger = {
    level: 'DEBUG',
    consoleLevel: 'DEBUG',
  };

  return config;
};
