const statsModel = require('./statsModel');

const statsController = {
  /**
   * GET /api/stats — ringkasan pelanggan hari ini + bulan ini
   * serta jumlah potong per barber. Khusus admin/owner.
   */
  async getDashboard(req, res) {
    const data = await statsModel.dashboard();
    res.json({ success: true, data });
  },

  /**
   * GET /api/stats/today — hanya statistik hari ini.
   */
  async getToday(req, res) {
    const data = await statsModel.today();
    res.json({ success: true, data });
  },

  /**
   * GET /api/stats/month — hanya statistik bulan ini.
   */
  async getMonth(req, res) {
    const data = await statsModel.thisMonth();
    res.json({ success: true, data });
  },

  /**
   * GET /api/stats/barbers — jumlah potong per barber.
   */
  async getBarbers(req, res) {
    const data = await statsModel.perBarber();
    res.json({ success: true, data });
  },
};

module.exports = statsController;