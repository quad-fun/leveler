// models/Bid.js
import mongoose from 'mongoose';

const BidSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  bidder: { type: String, required: true },
  totalCost: Number,
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'analyzed'], default: 'pending' },
  keyComponents: {
    materials: Number,
    labor: Number,
    overhead: Number
  },
  analysisResults: Object // Flexible field for analysis data
});

export default mongoose.models.Bid || mongoose.model('Bid', BidSchema);