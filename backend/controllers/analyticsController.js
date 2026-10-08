import * as analyticsService from '../services/analyticsService.js';

export async function getAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getAnalyticsData();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

