'use strict';

const _ = require('lodash');
const { AxiosService } = require('naf-framework-mongoose/lib/service');

const meta = {
  create: {
    uri: '/acct/create',
    method: 'post',
  },
  register: {
    uri: '/register',
    method: 'post',
  },
  login: {
    uri: '/login',
    method: 'post',
  },
};

class UserService extends AxiosService {
  constructor(ctx) {
    super(ctx, meta, _.get(ctx.app.config, 'axios.user'));
    this.model = this.ctx.model.Campus;
  }
}

module.exports = UserService;
