'use strict';

const assert = require('assert');
const Controller = require('egg').Controller;

class MembershipController extends Controller {
  async test() {
    this.ctx.body = 'this is a demo page';
  }

  // 【step1】 创建微信用户
  async corp_createUser() {
    const { openid } = this.ctx.query;
    assert(openid, '微信ID不能为空');

    // 创建用户
    const data = await this.service.axios.corp.createUser({ openid }, this.ctx.request.body);
    // 重新登录
    const res = await this.ctx.service.auth.loginCorp({ openid });
    this.ctx.ok({ ...res, newUser: data });
  }

  // 【step2】 注册企业名称
  async corp_register() {
    const { unit, openid } = this.ctx.query;
    assert(unit, '分站ID不能为空');
    assert(openid, '微信ID不能为空');

    // 创建企业
    const newCorp = await this.service.axios.corp.register({ openid, _tenant: unit }, this.ctx.request.body);
    this.logger.debug(`[corp_register] corp.register result: ${newCorp}`);
    // 重新登录
    const res = await this.ctx.service.auth.loginCorp({ openid });
    this.logger.debug(`[corp_register] auth.loginCorp result: ${res}`);

    this.ctx.ok({ ...res, newCorp });
  }

  async corp_login() {
    const { openid } = this.ctx.query;
    assert(openid, '微信ID不能为空');

    // 用户登录
    const res = await this.ctx.service.auth.loginCorp({ openid });
    this.ctx.ok(res);
  }

  async user_register() {
    const { openid } = this.ctx.query;
    assert(openid, '微信ID不能为空');

    const req = { ...this.ctx.request.body, account: openid };
    // 创建用户
    const data = await this.service.axios.user.register({}, req);
    // 重新登录
    const res = await this.ctx.service.auth.loginUser({ openid });
    this.ctx.ok({ ...res, newUser: data });
  }

  async user_login() {
    const { openid, id } = this.ctx.query;
    assert(openid, '微信ID不能为空');
    assert(id, '用户ID不能为空');

    // 用户登录
    const res = await this.ctx.service.auth.login({ openid });
    this.ctx.ok(res);
  }

  // 通过微信ID登录已绑定的用户
  async weixin_login() {
    const { openid } = this.ctx.query;
    assert(openid, '微信ID不能为空');

    const res = await this.ctx.service.auth.login(openid);
    this.ctx.ok(res);
  }
}

module.exports = MembershipController;
