const mongoose = require('mongoose');
const { Schema } = mongoose;
const Account = require('./account.model');

// tạo khung cho account
const savedSearchSchema = new mongoose.Schema({
	account_id: {type: Schema.Types.ObjectId, ref: Account},
	keyword: String,
  createdTime:{ type: Date, default: Date.now },
});

// tạo model
var SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);

module.exports = SavedSearch;
