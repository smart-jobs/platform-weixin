'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1540154736927_5913';

  // add your config here
  config.middleware = [];

  // add your config here
  config.cluster = {
    listen: {
      port: 8103,
    },
  };

  config.proxy = true;
  config.hostHeaders = 'x-forwarded-host';

  // 服务器发布路径
  config.baseUrl = '';
  // 认证回调地址
  config.authUrl = '/auth';

  config.errorMongo = {
    details: true,
  };
  config.errorHandler = {
    details: true,
  };

  // mongoose config
  config.mongoose = {
    url: 'mongodb://localhost:27017/platform',
    options: {
      user: 'root',
      pass: 'Ziyouyanfa#@!',
      authSource: 'admin',
      useNewUrlParser: true,
      useCreateIndex: true,
    },
  };

  // redis config
  config.redis = {
    client: {
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      password: null,
      db: 0,
    },
  };

  // 安全配置
  config.security = {
    csrf: {
      // ignoreJSON: true, // 默认为 false，当设置为 true 时，将会放过所有 content-type 为 `application/json` 的请求
      enable: false,
    },
  };

  // JWT config
  config.jwt = {
    secret: 'Ziyouyanfa!@#',
    expiresIn: '1h',
    subject: 'platform',
  };

  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.njk': 'nunjucks',
    },
  };

  config.test = {
    enable: true,
    corp: '5bd233253931128db02d9849',
    user: '5bd2520ce8e38ba1e8317ec0',
  };

  // axios service config
  config.axios = {
    corp: { // 企业信息查询服务
      baseUrl: 'http://localhost:8102/api',
    },
    user: { // 学生信息查询服务
      baseUrl: 'http://localhost:8101/api',
    },
  };

  return config;
};
