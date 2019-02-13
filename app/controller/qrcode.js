'use strict';

const _ = require('lodash');
const Controller = require('egg').Controller;

/**
 * 微信扫码登录
 */
class QrcodeController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.service = this.ctx.service.weixin;
  }

  // POST 生成二维码
  async create() {
    const res = await this.service.createQrcode();
    this.ctx.ok({ data: res });
  }

  // POST 检查二维码
  async check() {
    const { qrcode } = this.ctx.params;
    const res = await this.service.checkQrcode(qrcode);
    this.ctx.ok(res);
  }

  // POST 微信扫码登录
  async login() {
    const { token } = this.ctx.requestparam;
    const { qrcode } = this.ctx.params;
    await this.service.scanQrcode({ qrcode, token });
    this.ctx.ok();
  }

  // GET 微信扫码确认页面
  async scan() {
    // TODO: 获得微信认证token
    const token = this.ctx.query.token || this.ctx.cookies.get('wxtoken');
    if (!token) {
      // TODO: 跳转到授权地址
      const { authUrl = this.ctx.path } = this.app.config;
      const backUrl = encodeURI(this.ctx.originalUrl);
      const to_uri = `${authUrl}?response_type=token&redirect_uri=${backUrl}#wechat`;

      this.ctx.redirect(to_uri);
      return;
    }

    await this.ctx.render('login.njk', { message: '扫码登录测试', accout: '测试' });
  }

  // POST 换取微信认证token
  async token() {
    const { qrcode } = this.ctx.params;
    const res = await this.service.qrcodeLogin(qrcode);
    this.ctx.ok(res);
  }
}

module.exports = QrcodeController;
