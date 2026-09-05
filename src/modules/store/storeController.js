const storeModel = require('./storeModel');

const storeController = {
  /** GET /api/store/status — status buka/tutup toko (publik untuk tampilan). */
  async getStatus(req, res, next) {
    try {
      const status = await storeModel.getStatus();
      res.json({
        success: true,
        data: { is_open: Boolean(status.is_open) },
      });
    } catch (error) {
      next(error);
    }
  },

  /** PUT /api/store/status — ubah buka/tutup toko (admin). */
  async setStatus(req, res, next) {
    try {
      const isOpen = Boolean(req.body.is_open);
      const status = await storeModel.setStatus(isOpen, req.user ? req.user.id : null);

      res.json({
        success: true,
        message: isOpen ? 'Toko dibuka.' : 'Toko ditutup.',
        data: { is_open: Boolean(status.is_open) },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = storeController;