const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required"],
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

const blacklistModel = mongoose.model("BlacklistTokens", blacklistSchema);

module.exports = blacklistModel;