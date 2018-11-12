'use strict';

const assert = require('assert');
const _ = require('lodash');
const { BusinessError, ErrorCode } = require('naf-core').Error;
const jwt = require('jsonwebtoken');
const Service = require('egg').Service;
const axios = require('axios');


class WeixinAuthService extends Service {

  async request(url, data, options = {}) {
    try {
      const res = await axios({
        method: _.isUndefined(data) ? 'get' : 'post',
        url,
        data,
        responseType: 'json',
        ...options,
      });
      if (res.status !== 200) {
        return { errcode: ErrorCode.NETWORK, errmsg: `Http Code: ${res.status}` };
      }
      return res.data;
    } catch (err) {
      this.logger.error(`接口请求失败: ${err.config.url} - ${err.message}`);
      if (err.response && err.response.data) {
        this.logger.debug(err.response.data);
      }
      return { errcode: -1, errmsg: '接口请求失败' };
    }
  }

  // 通过认证码获得用户信息
  async fetchAuth(code) {
    // TODO:参数检查和默认参数处理
    assert(code);
    const { wxapi } = this.app.config;
    const url = `${wxapi.baseUrl}/api/fetch?code=${code}`;
    const res = await this.request(url);
    if (res.errcode && res.errcode !== 0) {
      this.ctx.logger.error(`[service.fetch] errcode: ${res.errcode}, errmsg: ${res.errmsg}`);
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '获得用户认证信息失败');
    }
    return res;
  }

  // 通过认证码完成微信登录
  async auth(code) {
    // TODO: 从redis中查询缓存的token
    const tokenKey = `smart:auth:token:${code}`;
    const openidKey = `smart:auth:openid:${code}`;
    const token = await this.app.redis.get(tokenKey);
    if (token) {
      const userinfo = await this.decodeJwt(token);
      const openid = await this.app.redis.get(openidKey);
      if (userinfo) {
        return { userinfo, token, openid };
      }
    }

    // TODO: 获得openid
    let res = await this.fetchAuth(code);
    const { openid } = res;
    await this.app.redis.set(openidKey, openid, 'EX', 600);

    // TODO: 通过openid获得登录凭证
    res = await this.login(openid);
    await this.app.redis.set(tokenKey, res.token, 'EX', 600);

    return res;
  }

  // 通过认证码完成微信登录
  async login(openid) {
    // TODO: 查询绑定用户信息
    // 用户数据格式：{userid: '用户数据id', name: '用户名称', unit: '分站标识', role: 'user、corp'}
    const bindKey = `smart:auth:bind:${openid}`;
    const role = await this.app.redis.get(bindKey);
    if (role === 'corp') {
      return await this.loginCorp({ openid });
    } else if (role === 'user') {
      return await this.loginUser({ openid });
    }

    const user = { userid: 'guest', name: '未注册', role: 'guest' };
    // TODO: 创建并缓存登录凭证
    const token = await this.createJwt(user);
    return { userinfo: user, token, openid };
  }

  async createJwt(userinfo) {
    const { userid = 'guest', unit } = userinfo;
    const { secret, expiresIn = '1d', issuer = 'weixin' } = this.config.jwt;
    const subject = _.isUndefined(unit) ? userid : `${userid}@${unit}`;
    const token = await jwt.sign(userinfo, secret, { expiresIn, issuer, subject });
    return token;
  }

  async decodeJwt(token) {
    try {
      const { secret } = this.config.jwt;
      const decoded = jwt.verify(token, secret);
      return decoded.payload;
    } catch (err) {
      this.ctx.logger.warn(`[decodeJwt] jwt token invalid: ${token}`);
    }
  }

  async bindRole({ openid, role }) {
    // 用户数据格式：{userid: '用户数据id', name: '用户名称', unit: '分站标识', role: 'user、corp'}
    const bindKey = `smart:auth:bind:${openid}`;
    await this.app.redis.set(bindKey, role);
  }

  async loginCorp({ openid }) {
    const res = await this.service.axios.corp.login({ openid }, this.ctx.request.body);
    // this.logger.debug('[loginCorp] corp.login result: ', res);

    const { user: data, units } = res;
    const userinfo = { userid: data.id || data._id, name: data.name,
      corpid: data.corpid, corpname: data.corpname, unit: units && units[0], units, role: 'corp' };

    const token = await this.createJwt(userinfo);

    // 保存绑定关系
    await this.bindRole({ openid, role: 'corp' });

    return { userinfo, token };
  }

  async loginUser({ openid }) {
    const res = await this.service.axios.user.login({ openid }, this.ctx.request.body);
    // this.logger.debug('[loginUser] user.login result: ', res);

    const { user: data, reg } = res;
    // 用户数据格式：{userid: '用户数据id', name: '用户名称', unit: '分站标识', role: 'user、corp'}
    const userinfo = { userid: data.userid, name: data.name, unit: _.get(reg, '_tenant'), role: 'user' };
    const token = await this.createJwt(userinfo);

    // 保存绑定关系
    await this.bindRole({ openid, role: 'user' });

    userinfo.reg = reg;
    return { userinfo, token };
  }
}

module.exports = WeixinAuthService;
