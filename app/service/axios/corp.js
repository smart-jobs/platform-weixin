'use strict';

const _ = require('lodash');
const { AxiosService } = require('naf-framework-mongoose/lib/service');

const meta = {
  register: {
    uri: '/register/create',
    method: 'post',
  },
  complete: {
    uri: '/register/complete',
    method: 'post',
  },
  login: {
    uri: '/login',
    method: 'post',
  },
};

class CorpService extends AxiosService {
  constructor(ctx) {
    super(ctx, meta, _.get(ctx.app.config, 'axios.corp'));
    this.model = this.ctx.model.Campus;
  }
}

module.exports = CorpService;
