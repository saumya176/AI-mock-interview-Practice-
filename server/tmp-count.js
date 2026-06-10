const mongoose = require('mongoose');
const Interview = require('./models/Interview');
(async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const userId = '6a12f1689c593d38e8fb3752';
  const pipeline = [
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $addFields: {
      overallScore: { $ifNull: ['$overallScore', '$totalScore', '$score', 0] },
      completedAt: { $ifNull: ['$completedAt', '$createdAt'] },
      status: { $ifNull: ['$status', 'Completed'] },
      selectedSkills: { $ifNull: ['$selectedSkills', '$skills', []] },
      weakAreas: { $cond: [{ $isArray: '$weakAreas' }, '$weakAreas', { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$weakAreas', ''] } }, 0] }, ['$weakAreas'], []] }] },
      strongAreas: { $cond: [{ $isArray: '$strongAreas' }, '$strongAreas', { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$strongAreas', ''] } }, 0] }, ['$strongAreas'], []] }] },
      skills: { $ifNull: ['$skills', []] }
    } },
    { $match: { $or: [ { 'questions.0': { $exists: true } }, { 'geminiReport.questions.0': { $exists: true } }, { overallScore: { $gt: 0 } } ] } },
    { $sort: { interviewId: 1, overallScore: -1, createdAt: -1 } },
    { $group: { _id: { $ifNull: ['$interviewId', '$_id'] }, doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { createdAt: -1 } },
    { $facet: { metadata: [{ $count: 'total' }], data: [{ $limit: 12 }] } }
  ];
  const [result] = await Interview.aggregate(pipeline);
  console.log('HISTORY_TOTAL_AFTER_DEDUP', result.metadata[0]?.total || 0);
  console.log('HISTORY_PAGE_ITEMS', result.data.length);
  await mongoose.disconnect();
})();
