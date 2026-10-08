import * as analyticsService from '../services/analyticsService.js';

export async function getDashboard(req, res, next) {
  try {
    const { lowStockThreshold } = req.query;
    const data = await analyticsService.getDashboardData(lowStockThreshold);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

