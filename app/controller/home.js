'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    this.ctx.body = 'hi, egg!!!!!';
  }
  async demo() {
    await this.ctx.render('redirect.njk', {redirect_uri: '/info'});
  }
  async info() {
    await this.ctx.render('info.njk', {message: 'this is a demo page'});
  }
  async test() {
    this.ctx.body = 'this is a demo page';
  }
}

module.exports = HomeController;
