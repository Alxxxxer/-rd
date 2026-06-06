const LeadService = require('../services/LeadService');

class LeadController {
  async getAllLeads(req, res, next) {
    try {
      const { search, status, source, assignedTo, page = 1, limit = 10 } = req.query;
      const user = req.user;

      const filters = { search, status, source, assignedTo };
      const options = { page, limit };

      const result = await LeadService.getAllLeads(user, filters, options);

      res.status(200).json({
        success: true,
        data: result.leads,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: Number(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createLead(req, res, next) {
    try {
      const user = req.user;
      const lead = await LeadService.createLead(user, req.body);

      res.status(201).json({
        success: true,
        message: 'Lead created successfully.',
        data: lead
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLead(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;

      const lead = await LeadService.updateLead(user, id, req.body);

      res.status(200).json({
        success: true,
        message: 'Lead updated successfully.',
        data: lead
      });
    } catch (error) {
      next(error);
    }
  }

  async addLeadNote(req, res, next) {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const user = req.user;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Note text cannot be empty.'
        });
      }

      const lead = await LeadService.addLeadNote(user, id, text);

      res.status(200).json({
        success: true,
        message: 'Comment appended successfully.',
        data: lead
      });
    } catch (error) {
      next(error);
    }
  }

  async importGoogleSheets(req, res, next) {
    try {
      const { sheetUrl } = req.body;
      const user = req.user;

      if (!sheetUrl) {
        return res.status(400).json({
          success: false,
          message: 'Google Sheets URL is required.'
        });
      }

      const result = await LeadService.importGoogleSheets(user, sheetUrl);

      res.status(200).json({
        success: true,
        message: `${result.count} leads processed successfully.`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLead(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;

      const result = await LeadService.deleteLead(user, id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LeadController();
