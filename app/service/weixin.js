'use strict';

const assert = require('assert');
const _ = require('lodash');
const { BusinessError, ErrorCode } = require('naf-core').Error;
const jwt = require('jsonwebtoken');
const { AxiosService } = require('naf-framework-mongoose/lib/service');


class WeixinAuthService extends AxiosService {

  constructor(ctx) {
    super(ctx, {}, _.get(ctx.app.config, 'wxapi'));
  }

  // 通过认证码获得用户信息
  async fetch(code) {
    // TODO:参数检查和默认参数处理
    assert(code);
    const { wxapi } = this.app.config;
    let res = await this.request('/api/fetch', { code });
    if (res.errcode && res.errcode !== 0) {
      this.ctx.logger.error(`[WeixinAuthService] fetch open by code fail, errcode: ${res.errcode}, errmsg: ${res.errmsg}`);
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '获得微信认证信息失败');
    }
    const { openid } = res;

    // TODO: 获得用户信息
    res = await this.request('/api.weixin.qq.com/cgi-bin/user/info?lang=zh_CN',
      { appid: wxapi.appid, openid });
    // console.debug('res: ', res);
    if (res.errcode && res.errcode !== 0) {
      this.ctx.logger.error(`[WeixinAuthService] fetch userinfo by openid fail, errcode: ${res.errcode}, errmsg: ${res.errmsg}`);
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '获得微信用户信息失败');
    }
    return res;
  }

  async createJwt({ openid, nickname, subscribe }) {
    const { secret, expiresIn = '1d', issuer = 'weixin' } = this.config.jwt;
    const subject = openid;
    const userinfo = { nickname, subscribe };
    const token = await jwt.sign(userinfo, secret, { expiresIn, issuer, subject });
    return token;
  }

}

module.exports = WeixinAuthService;
