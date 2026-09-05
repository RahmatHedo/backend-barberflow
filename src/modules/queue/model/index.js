const helpers = require('./helpers');
const workload = require('./workload');
const queries = require('./queries');
const { joinQueue } = require('./join');
const transitions = require('./transitions');

const queueModel = {
  getBarbersOverview: queries.getBarbersOverview,
  findById: queries.getById,
  getTodayEntries: queries.getTodayEntries,
  getBarberQueue: queries.getBarberQueue,
  checkMyQueue: queries.checkMyQueue,
  getWaitingLine: queries.getWaitingLine,
  joinQueue,
  callNextForBarber: transitions.callNextForBarber,
  completeService: transitions.completeService,
  markNoShow: transitions.markNoShow,
  cancelEntry: transitions.cancelEntry,
  ...helpers,
  ...workload,
};

module.exports = queueModel;