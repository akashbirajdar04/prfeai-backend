const asyncHandler = require('express-async-handler');
const Session = require('../models/sessionmodel');
const { runLighthouse } = require('../services/lighthouse.service');
const { uploadJSON } = require('../services/cloudinary.service');
const aiService = require('../services/ai.service');

// @desc    Start new analysis
// @route   POST /api/analysis/start
// @access  Private
const startAnalysis = asyncHandler(async (req, res) => {
   let { url } = req.body;

   if (!url) {
      res.status(400);
      throw new Error('URL is required');
   }

   // Normalize URL
   if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
   }

   // Create session
   const session = await Session.create({
      userId: req.user._id,
      targetUrl: url,
      status: 'running'
   });

   // Start Async Process (Fire and Forget or Background Job)
   // For demo simplicity, we'll await part of it or use setImmediate to not block response?
   // User expects a progress bar, so we return ID immediately.

   res.status(201).json({ sessionId: session._id, message: 'Analysis started' });

   // BACKGROUND PROCESS
   (async () => {
      try {
         console.log(`[Job] Starting analysis for ${session._id} - URL: ${url}`);

         // 1. Run Lighthouse
         console.log(`[Job] Calling runLighthouse...`);
         const { rawReport, metrics } = await runLighthouse(url);
         console.log(`[Job] Lighthouse done. Uploading report...`);

         const lhUrl = await uploadJSON(rawReport, 'lighthouse_reports');
         console.log(`[Job] Upload done: ${lhUrl}`);

         // 2. Wait for Telemetry & AI
         // Stop here. We wait for user to install SDK and send telemetry.
         // Or user manually triggers AI generation.

         console.log(`[Job] Updating session ${session._id} to waiting_for_telemetry`);
         await Session.findByIdAndUpdate(session._id, {
            status: 'waiting_for_telemetry', // New status
            'artifacts.lighthouseReportUrl': lhUrl,
            // Save partial metrics (Lighthouse only)
            'metrics.performance': {
               score: metrics.performanceScore,
               lcp: metrics.lcp,
               cls: metrics.cls,
               inp: metrics.inp,
               ttfb: metrics.ttfb
            },
            'metrics.seo': {
               score: metrics.seoScore,
               issues: []
            }
         });
         console.log(`[Job] Lighthouse completed & saved for ${session._id}`);

      } catch (error) {
         console.error(`[Job] FATAL ERROR for ${session._id}:`, error);
         console.error(`[Job] Stack Trace:`, error.stack);
         await Session.findByIdAndUpdate(session._id, { status: 'failed' });
      }
   })();
});

// @desc    Get session details
// @route   GET /api/analysis/:id
// @access  Private
const getAnalysis = asyncHandler(async (req, res) => {
   const session = await Session.findById(req.params.id);

   if (!session) {
      res.status(404);
      throw new Error('Session not found');
   }

   if (session.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
   }

   res.json(session);
});

// @desc    Get user history
// @route   GET /api/analysis/history
// @access  Private
// @desc    Generate AI Insights (Step 2)
// @route   POST /api/analysis/:id/ai
// @access  Private
const generateAI = asyncHandler(async (req, res) => {
   const session = await Session.findById(req.params.id);

   if (!session) {
      res.status(404);
      throw new Error('Session not found');
   }

   if (session.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
   }

   res.json({ message: 'AI generation started' });

   // BACKGROUND PROCESS
   (async () => {
      try {
         console.log(`[Job] Starting AI analysis for ${session._id}`);

         // Re-construct metrics for AI
         const metrics = {
            performanceScore: session.metrics?.performance?.score || 0,
            seoScore: session.metrics?.seo?.score || 0,
            lcp: session.metrics?.performance?.lcp,
            cls: session.metrics?.performance?.cls,
            ttfb: session.metrics?.performance?.ttfb
         };

         const aiRecommendations = await aiService.analyze(metrics, session._id.toString());
         const aiUrl = await uploadJSON(aiRecommendations, 'ai_recommendations');

         await Session.findByIdAndUpdate(session._id, {
            status: 'completed',
            'artifacts.llmResponseUrl': aiUrl,
            'metrics.ai': aiRecommendations
         });
         console.log(`[Job] AI Analysis completed for ${session._id}`);

      } catch (error) {
         console.error(`[Job] AI Failed for ${session._id}:`, error);
         // Don't mark whole session failed, just this step? 
         // keeping it simple
      }
   })();
});

const getHistory = asyncHandler(async (req, res) => {
   const sessions = await Session.find({ userId: req.user._id }).sort({ createdAt: -1 });
   res.json(sessions);
});

module.exports = { startAnalysis, getAnalysis, getHistory, generateAI };
