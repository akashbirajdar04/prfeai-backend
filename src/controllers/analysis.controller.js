const asyncHandler = require('express-async-handler');
const Session = require('../models/sessionmodel');
const aiService = require('../services/ai.service');
const ragService = require('../../../rag/services/rag.service');
const { uploadJSON } = require('../services/cloudinary.service');
const webhookService = require('../services/webhook.service');
const analysisService = require('../services/analysis.service');

// @desc    Start new analysis
// @route   POST /api/analysis/start
// @access  Private
const startAnalysis = asyncHandler(async (req, res) => {
   const { url } = req.body;

   const session = await Session.create({
      userId: req.user._id,
      targetUrl: url,
      status: 'running'
   });

   res.status(201).json({ sessionId: session._id, message: 'Analysis started' });

   // Fire and forget Lighthouse job
   analysisService.startLighthouseJob(session._id, url).catch(console.error);
});

// @desc    Get session details
const getAnalysis = asyncHandler(async (req, res) => {
   const session = await Session.findById(req.params.id);
   if (!session || session.userId.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Session not found or not authorized');
   }
   res.json(session);
});

// @desc    Generate AI Insights (Step 2)
const generateAI = asyncHandler(async (req, res) => {
   const session = await Session.findById(req.params.id);
   if (!session || session.userId.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Session not found');
   }

   res.json({ message: 'AI generation started' });

   (async () => {
      try {
         const metrics = { ...session.metrics.performance, performanceScore: session.metrics.performance.score };

         // LAZY RAG INGESTION
         const apiMetrics = session.metrics?.api || [];
         if (apiMetrics.length > 0) await ragService.ingestAPI(session._id.toString(), apiMetrics);
         if (session.metrics?.performance) await ragService.ingestLighthouse(session._id.toString(), metrics);

         // TREND ANALYSIS
         const previousSession = await Session.findOne({
            userId: session.userId,
            targetUrl: session.targetUrl,
            status: 'completed',
            _id: { $ne: session._id }
         }).sort({ createdAt: -1 });

         const previousMetrics = previousSession?.metrics?.performance
            ? { performanceScore: previousSession.metrics.performance.score, lcp: previousSession.metrics.performance.lcp }
            : null;

         const aiRecommendations = await aiService.analyze(metrics, session._id.toString(), previousMetrics);
         const aiUrl = await uploadJSON(aiRecommendations, 'ai_recommendations');

         await Session.findByIdAndUpdate(session._id, {
            status: 'completed',
            'artifacts.llmResponseUrl': aiUrl,
            'metrics.ai': aiRecommendations
         });

         // ALERTING
         const highSev = aiRecommendations.find(r => r.severity === 'high' || r.severity === 'critical');
         if (highSev && process.env.ALERT_WEBHOOK_URL) {
            await webhookService.sendAlert(process.env.ALERT_WEBHOOK_URL, {
               sessionId: session._id,
               targetUrl: session.targetUrl,
               severity: highSev.severity,
               insight: highSev.description.split('\n')[0]
            });
         }
      } catch (error) {
         console.error(`[Job] AI Failed for ${session._id}:`, error);
      }
   })();
});

const getHistory = asyncHandler(async (req, res) => {
   const limit = parseInt(req.query.limit) || 0;
   const sessions = await Session.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(limit);
   res.json(sessions);
});

const getDashboardStats = asyncHandler(async (req, res) => {
   const userId = req.user._id;
   const totalAnalyses = await Session.countDocuments({ userId });
   const stats = await Session.aggregate([
      { $match: { userId: userId.toString(), status: 'completed' } },
      { $group: { _id: null, avgPerformance: { $avg: "$metrics.performance.score" }, avgSeo: { $avg: "$metrics.seo.score" } } }
   ]);

   const sessionsWithApi = await Session.find({ userId: userId.toString(), status: 'completed', 'metrics.api': { $exists: true, $not: { $size: 0 } } });
   let totalLatency = 0, endpointCount = 0;
   sessionsWithApi.forEach(s => s.metrics.api.forEach(api => { totalLatency += api.avgLatency; endpointCount++; }));
   const avgLatency = endpointCount > 0 ? (totalLatency / endpointCount).toFixed(0) : 0;

   res.json({
      totalAnalyses,
      avgPerformance: stats[0]?.avgPerformance?.toFixed(0) || 0,
      avgSeo: stats[0]?.avgSeo?.toFixed(0) || 0,
      avgLatency: `${avgLatency}ms`
   });
});

const compareSessions = asyncHandler(async (req, res) => {
   const { idA, idB } = req.body;
   const sessionA = await Session.findById(idA), sessionB = await Session.findById(idB);
   if (!sessionA || !sessionB) throw new Error('Sessions not found');
   res.json(await aiService.compare(sessionA, sessionB));
});

module.exports = { startAnalysis, getAnalysis, getHistory, generateAI, compareSessions, getDashboardStats };
