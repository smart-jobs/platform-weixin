'use strict';

const assert = require('assert');
const uuid = require('uuid');
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
    let res = await this.httpGet('/api/fetch', { code });
    if (res.errcode && res.errcode !== 0) {
      this.ctx.logger.error(`[WeixinAuthService] fetch open by code fail, errcode: ${res.errcode}, errmsg: ${res.errmsg}`);
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '获得微信认证信息失败');
    }
    const { openid } = res;

    // TODO: 获得用户信息
    res = await this.httpGet('/api.weixin.qq.com/cgi-bin/user/info?lang=zh_CN',
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
  /**
   * 创建二维码
   * 随机生成二维码，并保存在Redis中，状态初始为pending
   * 状态描述：
   * pending - 等待扫码
   * consumed - 使用二维码登录完成
   * scand:token - Jwt登录凭证
   */
  async createQrcode() {
    const qrcode = uuid();
    const key = `smart:qrcode:login:${qrcode}`;
    await this.app.redis.set(key, 'pending', 'EX', 600);
    return qrcode;
  }

  /**
 * 扫码登录确认
 */
  async scanQrcode({ qrcode, token }) {
    assert(qrcode, 'qrcode不能为空');
    assert(token, 'token不能为空');
    const key = `smart:qrcode:login:${qrcode}`;
    const status = await this.app.redis.get(key);
    if (!status) {
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '二维码已过期');
    }
    if (status !== 'pending') {
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '二维码状态无效');
    }

    // TODO: 修改二维码状态，登录凭证保存到redis
    await this.app.redis.set(key, `scaned:${token}`, 'EX', 600);

    // TODO: 发布扫码成功消息
    const { mq } = this.ctx;
    const ex = 'qrcode.login';
    if (mq) {
      await mq.topic(ex, qrcode, 'scaned', { durable: true });
    } else {
      this.ctx.logger.error('!!!!!!没有配置MQ插件!!!!!!');
    }
  }

  // 使用二维码换取登录凭证
  async qrcodeLogin(qrcode) {
    assert(qrcode, 'qrcode不能为空');
    const key = `smart:qrcode:login:${qrcode}`;
    const val = await this.app.redis.get(key);
    if (!val) {
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '二维码已过期');
    }
    const [ status, token ] = val.split(':', 2);
    if (status !== 'scaned' || !token) {
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '二维码状态无效');
    }

    // TODO: 修改二维码状态
    await this.app.redis.set(key, 'consumed', 'EX', 600);

    return { token };
  }

  // 检查二维码状态
  async checkQrcode(qrcode) {
    assert(qrcode, 'qrcode不能为空');
    const key = `smart:qrcode:login:${qrcode}`;
    const val = await this.app.redis.get(key);
    if (!val) {
      throw new BusinessError(ErrorCode.SERVICE_FAULT, '二维码已过期');
    }
    const [ status ] = val.split(':', 2);
    return { status };
  }

}

module.exports = WeixinAuthService;
