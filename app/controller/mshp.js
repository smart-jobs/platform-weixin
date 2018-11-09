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
    // 保存绑定关系
    const res = await this.ctx.service.auth.bindCorp({ openid, data });
    this.ctx.ok(res);
  }

  // 【step2】 注册企业名称
  async corp_register() {
    const { unit, openid } = this.ctx.query;
    assert(unit, '分站ID不能为空');
    assert(openid, '微信ID不能为空');

    // 创建企业
    await this.service.axios.corp.register({ openid, _tenant: unit }, this.ctx.request.body);
    // 重新登录用户
    await this.corp_login();
  }

  async corp_login() {
    const { openid } = this.ctx.query;
    assert(openid, '微信ID不能为空');

    // 用户登录
    const { user: data, units } = await this.service.axios.corp.login({ openid }, this.ctx.request.body);
    // 保存绑定关系
    const res = await this.ctx.service.auth.bindCorp({ openid, units, data });
    this.ctx.ok(res);
  }

  async user_register() {
    const { openid } = this.ctx.query;
    assert(openid, '微信ID不能为空');

    const req = { ...this.ctx.request.body, account: openid };
    // 创建用户
    const data = await this.service.axios.user.register({}, req);
    // 保存绑定关系
    const res = await this.ctx.service.auth.bindUser({ openid, data });
    this.ctx.ok(res);
  }

  async user_login() {
    const { openid, id } = this.ctx.query;
    assert(openid, '微信ID不能为空');
    assert(id, '用户ID不能为空');

    // 用户登录
    const data = await this.service.axios.user.login({ id }, this.ctx.request.body);
    // 保存绑定关系
    const res = await this.ctx.service.auth.bindUser({ openid, data });
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
