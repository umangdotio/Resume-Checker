const express = require('express');

const authRouter = express.Router();

const userModel = require('../models/user.model');

authRouter.post('/signUp',  () => {});

module.exports = authRouter;