'use strict';

const assert = require('assert');
const _ = require('lodash');
const uuid = require('uuid');
const Controller = require('egg').Controller;
const { CrudController } = require('naf-framework-mongoose/lib/controller');
const { BusinessError, ErrorCode } = require('naf-core').Error;

class AuthController extends Controller {
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
    const { redirect_uri, response_type = 'code', code, test } = this.ctx.query;
    if(test && _.get(this.app.config, 'test.enable')) {
      return await this.authTest();
    }
    if(code) {
      return await this.authBack();
    }

    this.ctx.logger.debug(`[auth] reditect_uri - ${redirect_uri}, response_type - ${response_type}`);
    assert(redirect_uri, '回调地址不能为空');

    // TODO: 保存原始请求地址
    const state = uuid();
    const key = `smart:auth:state:${state}`;
    const val = JSON.stringify({redirect_uri, response_type});
    await this.app.redis.set(key, val, 'EX', 600);

    // TODO: 生成回调地址
    const { wxapi, authUrl = this.ctx.path } = this.app.config;
    let backUrl;
    if(authUrl.startsWith('http')) {
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

    const { userinfo, token, openid } = await this.ctx.service.auth.auth(code);

    const key = `smart:auth:state:${state}`;
    const val = await this.app.redis.get(key);
    if(!val) {
      await this.ctx.render('error.njk', { message: 'state无效' });
      return;
    }
    const { redirect_uri, response_type } = JSON.parse(val);

    if(response_type == 'code') {
      this.ctx.redirect(`${redirect_uri}?code=${code}`);
    } else {
      await this.ctx.render('redirect.njk', { userinfo: JSON.stringify(userinfo), token, openid, redirect_uri });
    }
  }

  // GET 请求认证
  async fetch() {
    const { code } = this.ctx.query;
    this.ctx.logger.debug(`[fetch] code - ${code}`);
    assert(code, 'code不能为空');

    const tokenKey = `smart:auth:code:${code}`;
    const token = await this.app.redis.get(tokenKey);
    if(!token) {
      throw new BusinessError(ErrorCode.SERVICE_FAULT, 'code无效');
    }
    const userinfo = await this.ctx.service.auth.decodeJwt(token); 
    if(!userinfo) {
      throw new BusinessError(ErrorCode.SERVICE_FAULT, 'token无效');
    }

    this.ctx.ok({ userinfo, token });
  }

  // GET 用户授权内部测试接口
  async authTest() {
    const { redirect_uri, test, unit, openid } = this.ctx.query;
    this.ctx.logger.debug(`[auth-test] reditect_uri - ${redirect_uri}, role - ${test}`);
    assert(redirect_uri, '回调地址不能为空');
    
    const role = (test === 'user' || test === 'corp') ? test : 'guest';
    const userid = role === 'guest' ? 'guest' : _.get(this.app.config, ['test', role]);
    if(!userid) {
      this.ctx.logger.error('[auth-test] 未配置测试用户ID');
      await this.ctx.render('error.njk', { message: '未配置测试用户ID'});
      return;
    }

    // TODO: 查询绑定用户信息
    // 用户数据格式：{userid: '用户数据id', name: '用户名称', unit: '分站标识', role: 'user、corp'}
    let user;
    if(openid) {
      const bindKey = `smart:auth:bind:${openid}`;
      const val = await this.app.redis.get(bindKey);
      if(val) {
        user = JSON.parse(val);
      } else {
        user = { userid: 'guest', name: '未注册', unit: '', role: 'guest' };
      }
    } else {
      openid  = '1234567890';
      user = {userid, name: '测试用户', role, unit: (role === 'corp') ? unit || '99991' : unit};
    }

    

    const token = await this.ctx.service.auth.createJwt(user);

    await this.ctx.render('redirect.njk', { userinfo: JSON.stringify(user), token, openid, redirect_uri });
  }

}

module.exports = AuthController;
