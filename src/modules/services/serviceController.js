// ===========================================
// Service Controller - CRUD for barbershop services
// ===========================================

const serviceModel = require('./serviceModel');
const { AppError } = require('../../middleware/errorHandler');

const serviceController = {
  /**
   * GET /api/services
   * Get all active services.
   * Public endpoint — shown to customers.
   */
  async getServices(req, res, next) {
    try {
      const services = await serviceModel.findAll();

      res.json({
        success: true,
        data: { services },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/services/all
   * Get all services including inactive.
   * Admin only — for management panel.
   */
  async getAllServices(req, res, next) {
    try {
      const services = await serviceModel.findAllAdmin();

      res.json({
        success: true,
        data: { services },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/services
   * Create a new service.
   * Admin only.
   *
   * Body: { name, description?, duration_minutes, price, display_order? }
   */
  async createService(req, res, next) {
    try {
      const { name, description, duration_minutes, price, display_order } = req.body;

      const result = await serviceModel.create({
        name,
        description,
        duration_minutes,
        price,
        display_order,
      });

      const newService = await serviceModel.findById(result.insertId);

      res.status(201).json({
        success: true,
        message: 'Service created successfully.',
        data: { service: newService },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/services/:id
   * Update an existing service.
   * Admin only.
   *
   * Body: Partial update — any combination of { name, description, duration_minutes, price, is_active, display_order }
   */
  async updateService(req, res, next) {
    try {
      const { id } = req.params;

      // Check if service exists
      const existing = await serviceModel.findById(id);
      if (!existing) {
        throw new AppError('Service not found.', 404);
      }

      const { name, description, duration_minutes, price, is_active, display_order } = req.body;

      await serviceModel.update(id, {
        name,
        description,
        duration_minutes,
        price,
        is_active,
        display_order,
      });

      const updatedService = await serviceModel.findById(id);

      res.json({
        success: true,
        message: 'Service updated successfully.',
        data: { service: updatedService },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/services/:id
   * Soft-delete a service (set is_active = false).
   * Admin only.
   */
  async deleteService(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await serviceModel.findById(id);
      if (!existing) {
        throw new AppError('Service not found.', 404);
      }

      await serviceModel.softDelete(id);

      res.json({
        success: true,
        message: 'Service deactivated successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = serviceController;