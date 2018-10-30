'use strict';

const assert = require('assert');
const _ = require('lodash');
const uuid = require('uuid');
const { BusinessError, ErrorCode } = require('naf-core').Error;
const jwt = require('jsonwebtoken');
const Service = require('egg').Service;
const axios = require('axios');


class WeixinAuthService extends Service {
  
  async request(url, data, options = {}) {
    try{
      const res = await axios({
        method: _.isUndefined(data) ? 'get' : 'post',
        url,
        data,
        responseType: 'json',
        ...options,
      });
      if(res.status !== 200) {
        return { errcode: ErrorCode.NETWORK, errmsg: `Http Code: ${res.status}` };
      }
      return res.data;
    }catch(err){
      console.error(`接口请求失败: ${err.config.url} - ${ err.message }`);
      if(err.response && err.response.data) {
        console.debug(err.response.data);
      }
      return { errcode: -1, errmsg: '接口请求失败' };
    }
  }
  
  // 通过认证码获得用户信息
  async fetchAuth(code) {
    // TODO:参数检查和默认参数处理
    assert(code);
    const {wxapi} = this.app.config;
    const url = `${wxapi.baseUrl}/api/fetch?code=${code}`;
    const res = await this.request(url);
    if (res.errcode && res.errcode !== 0) {
      this.ctx.logger.error(`[service.fetch] errcode: ${res.errcode}, errmsg: ${res.errmsg}`);
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '获得用户认证信息失败');
    };
    return res;
  }

  // 通过认证码完成微信登录
  async auth(code) {
    // TODO: 从redis中查询缓存的token
    const tokenKey = `smart:auth:token:${code}`;
    const openidKey = `smart:auth:openid:${code}`;
    let token = await this.app.redis.get(tokenKey);
    if(token) {
      const userinfo = await this.decodeJwt(token);
      const openid = await this.app.redis.get(openidKey);
      if(userinfo) {
        return { userinfo, token, openid };
      }
    } 

    // TODO: 获得openid
    let res = await this.fetchAuth(code);
    const { openid } = res;
    await this.app.redis.set(openidKey, openid, 'EX', 600);

    // TODO: 查询绑定用户信息
    // 用户数据格式：{userid: '用户数据id', name: '用户名称', unit: '分站标识', role: 'user、corp'}
    const bindKey = `smart:auth:bind:${openid}`;
    const val = await this.app.redis.get(bindKey);
    let user;
    if(val) {
      user = JSON.parse(val);
    } else {
      user = { userid: 'guest', name: '未注册', unit: '', role: 'guest' };
    }

    // TODO: 创建并缓存登录凭证
    token = await this.createJwt(user);
    await this.app.redis.set(tokenKey, token, 'EX', 600);

    return { userinfo: user, token, openid };
  }

  async createJwt(userinfo) {
    const { userid, unit } = userinfo;
    const { secret, expiresIn = '1h', issuer = 'weixin' } = this.config.jwt;
    const subject = _.isUndefined(unit) ? userid : `${userid}@${unit}`;
    const token = await jwt.sign(userinfo, secret, { expiresIn, issuer, subject });
    return token;
  }

  async decodeJwt(token) {
    try{
      const { secret, expiresIn = '1h', issuer = 'weixin' } = this.config.jwt;
      const decoded = jwt.verify(token, secret);
      return decoded.payload;
    }catch(err){
      this.ctx.logger.warn(`[decodeJwt] jwt token invalid: ${token}`);
    }
  }

  async bindCorp( { openid, unit, data }) {
    // 用户数据格式：{userid: '用户数据id', name: '用户名称', unit: '分站标识', role: 'user、corp'}
    const userinfo = { userid: data.id || data._id, name: data.corpname, unit, role: 'corp' };
    const bindKey = `smart:auth:bind:${openid}`;
    
    await this.app.redis.set(bindKey, JSON.stringify(userinfo));
    const token = await this.createJwt(userinfo);
    return { userinfo, token };
  }

  async bindUser( { openid, data }) {
    // 用户数据格式：{userid: '用户数据id', name: '用户名称', unit: '分站标识', role: 'user、corp'}
    const userinfo = { userid: data.id || data._id, name: data.xm, unit: _.get(data, 'enrollment.yxdm'), role: 'user' };
    const bindKey = `smart:auth:bind:${openid}`;
    
    await this.app.redis.set(bindKey, JSON.stringify(userinfo));
    const token = await this.createJwt(userinfo);
    return { userinfo, token };
  }



}

module.exports = WeixinAuthService;
