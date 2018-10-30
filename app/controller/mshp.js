'use strict';

const assert = require('assert');
const Controller = require('egg').Controller;

class MembershipController extends Controller {
  async test() {
    this.ctx.body = 'this is a demo page';
  }

  async corp_register() {
    const { unit, openid } = this.ctx.query;
    assert(unit, '分站ID不能为空');
    assert(openid, '微信ID不能为空');

    const req = { ...this.ctx.request.body, account: openid };
    // 创建用户
    const data = await this.service.axios.corp.register({tenant: unit}, req);
    // 保存绑定关系
    const res = await this.ctx.service.auth.bindCorp({ openid, unit, data: res });
    this.ctx.ok(res);
  }

  async corp_complete() {
    const { unit, id } = this.ctx.query;
    assert(unit, '分站ID不能为空');
    assert(id, '企业ID不能为空');

    const res = await this.service.axios.corp.complete({id, tenant: unit}, this.ctx.request.body);
    this.ctx.ok({ data: res });
  }

  async corp_login() {
    const { openid, unit, id } = this.ctx.query;
    assert(openid, '微信ID不能为空');
    assert(unit, '分站ID不能为空');
    assert(id, '企业ID不能为空');

    // 用户登录
    const data = await this.service.axios.corp.login({id, tenant: unit}, this.ctx.request.body);
    // 保存绑定关系
    const res = await this.ctx.service.auth.bindCorp({ openid, unit, data });
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

  async user_enroll() {
    const { openid, id } = this.ctx.query;
    assert(openid, '微信ID不能为空');
    assert(id, '用户ID不能为空');

    const data = await this.service.axios.user.enroll({ id }, this.ctx.request.body);
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
}

module.exports = MembershipController;
