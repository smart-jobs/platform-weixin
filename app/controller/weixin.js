'use strict';

const assert = require('assert');
const _ = require('lodash');
const uuid = require('uuid');
const Controller = require('egg').Controller;

/**
 * 微信认证，获得openid和用户信息，生成微信Jwt
 */
class WeixinController extends Controller {
  /**
   * 认证流程
   * 1. 缓存原始请求地址，生成state和认证回调地址
   * 2. 通过wxapi认证，获得认证code
   * 3. 通过code获得openid，通过openid，查询绑定用户，创建jwt
   * 4. jwt写入redis，返回认证code
   * 5. 通过code获取jwt
   */
  // GET 请求认证
  // response_type:
  //       code - url带上code参数重定向到原始地址，默认
  //       store - 认证结果写入sessionStore，然后重定向回请求页面（要求请求页面和认证服务在同一域名下）
  async auth() {
    const { redirect_uri, code, test } = this.ctx.query;
    if (test && _.get(this.app.config, 'test.enable')) {
      return await this.authTest();
    }
    if (code) {
      return await this.authBack();
    }

    this.ctx.logger.debug(`[auth] reditect_uri - ${redirect_uri}`);
    assert(redirect_uri, '回调地址不能为空');

    // TODO: 保存原始请求地址
    const state = uuid();
    const key = `smart:auth:state:${state}`;
    const val = JSON.stringify({ redirect_uri });
    await this.app.redis.set(key, val, 'EX', 600);

    // const { config } = this.app;
    // console.log('ctx.host: ', this.ctx.host);
    // console.log('config.hostHeaders: ', config.hostHeaders);

    // TODO: 生成回调地址
    const { wxapi, authUrl = this.ctx.path } = this.app.config;
    let backUrl;
    if (authUrl.startsWith('http')) {
      backUrl = encodeURI(`${authUrl}?state=${state}`);
    } else {
      backUrl = encodeURI(`${this.ctx.protocol}://${this.ctx.host}${authUrl}?state=${state}`);
    }
    const to_uri = `${wxapi.baseUrl}/api/auth?appid=${wxapi.appid}&response_type=code&redirect_uri=${backUrl}#wechat`;

    this.ctx.redirect(to_uri);
  }

  // GET 认证回调
  async authBack() {
    const { code, state } = this.ctx.query;
    this.ctx.logger.debug(`[auth-back] code - ${code}, state - ${state}`);
    assert(code, 'code不能为空');
    assert(state, 'state不能为空');

    const { weixin } = this.ctx.service;
    let openid,
      nickname,
      subscribe;
    try {
      ({ openid, nickname, subscribe } = await weixin.fetch(code));
    } catch (err) {
      await this.ctx.render('error.njk', { title: err.message, message: err.details });
      return;
    }

    if (!subscribe) {
      // const { baseUrl } = this.app.config;
      // this.ctx.redirect(`${baseUrl}/public/subscribe.html`);
      const { wxapi } = this.app.config;
      await this.ctx.render('subscribe.njk', { appid: wxapi.appid });
      return;
    }

    const key = `smart:auth:state:${state}`;
    const val = await this.app.redis.get(key);
    if (!val) {
      await this.ctx.render('error.njk', { message: 'state无效' });
      return;
    }
    const { redirect_uri } = JSON.parse(val);

    // TODO: 生成Jwt
    const token = await weixin.createJwt({ openid, nickname, subscribe });
    // TODO: 写入cookie
    this.ctx.cookies.set('wxtoken', token, { maxAge: 3600000, overwrite: true, signed: false });

    // TODO: 重定性到原始请求页面
    await this.ctx.render('redirect.njk', { userinfo: JSON.stringify({ openid, nickname, subscribe }), token, openid, redirect_uri });
  }

  // GET 用户授权内部测试接口
  async authTest() {
    const { redirect_uri, openid, nickname = '测试', subscribe = 1 } = this.ctx.query;
    this.ctx.logger.debug(`[auth-test] reditect_uri - ${redirect_uri}, openid - ${openid}`);
    assert(redirect_uri, '回调地址不能为空');
    assert(openid, 'openid不能为空');

    // TODO: 生成Jwt
    const userinfo = { openid, nickname, subscribe };
    const { weixin } = this.ctx.service;
    const token = await weixin.createJwt({ openid, nickname, subscribe });
    // TODO: 写入cookie
    this.ctx.cookies.set('wxtoken', token, { maxAge: 3600000, overwrite: true, signed: false });

    await this.ctx.render('redirect.njk', { userinfo: JSON.stringify(userinfo), token, openid, nickname, redirect_uri });
  }
}

module.exports = WeixinController;
