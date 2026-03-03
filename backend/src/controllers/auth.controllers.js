const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist.model");

/**
 * @name registerUserController
 * @desc Register a new user, reruires username, email and password in the request body. Checks if the user already exists and if not, creates a new user in the database.
 * @access Public
 */
async function registerUserController(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validate the input
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    // Check if the user already exists
    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user
    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("token", token);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        token: token,
      },
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/** 
 * @name loginUserController
 * @desc Login a user, requires email and password in the request body. Checks if the user exists and if the password is correct, then returns a JWT token.
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        // Validate the input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }   

        // Check if the user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }

        // Compare the password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
        );

        res.cookie("token", token);

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                token: token,
            },
        });
    } catch (error) {
        console.error("Error during user login:", error);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * @name logoutUserController
 * @desc Logout a user by clearing the JWT token cookie and also blacklisting the token.
 * @access Public
 */
async function logoutUserController(req, res) {
  try {
    // Blacklist the token
    const token = req.cookies.token;
    if (token) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Set expiration to 1 hour from now

      await blacklistModel.create({
        token: token,
        expiresAt: expiresAt,
      });
    }

    // Clear the token cookie
    res.clearCookie("token");

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during user logout:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {
// console.log("Decoded:", req.user);
    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


module.exports = {
  registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
};
