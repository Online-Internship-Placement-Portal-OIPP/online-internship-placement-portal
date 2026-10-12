/**
 * Barrel export for all Mongoose models.
 */
const User = require('./User');
const Internship = require('./Internship');
const Application = require('./Application');
const Test = require('./Test');
const Question = require('./Question');
const Result = require('./Result');
const Activity = require('./Activity');

module.exports = { User, Internship, Application, Test, Question, Result, Activity };

