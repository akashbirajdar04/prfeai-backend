const mongoose = require("mongoose");

const AnalysisSessionSchema = new mongoose.Schema(
  {
    // Reference to authenticated user (from token)
    userId: {
      type: String,   // comes from JWT/session
      required: true,
      index: true     // IMPORTANT for history queries
    },

    // Website being analyzed
    targetUrl: {
      type: String,
      required: true
    },

    // Analysis lifecycle
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "waiting_for_telemetry"],
      default: "pending"
    },

    // Cloudinary artifacts (files)
    artifacts: {
      lighthouseReportUrl: { type: String },
      endpointsUrl: { type: String },
      llmResponseUrl: { type: String }
    },

    // Summary Metrics (for Dashboard/Result display)
    metrics: {
      performance: {
        score: Number,
        lcp: String,
        cls: String,
        inp: String,
        ttfb: String,
        fcp: String,
        si: String,
        tbt: String
      },
      seo: {
        score: Number,
        issues: Array
      },
      api: Array, // Aggregated endpoint data
      ai: Array   // Recommendations
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AnalysisSession", AnalysisSessionSchema);
