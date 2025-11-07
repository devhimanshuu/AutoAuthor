const jwt = require("jsonwebtoken");
const User = require("../Models/User");

//helper: generate JWT token

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

//@desc    Register new user
//@route   POST /api/auth/register
//access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    //check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    //create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
        avatar: user.avatar,
        token: generateToken(user._id),
        message: "User registered successfully",
      });
    } else {
      {
        res.status(400).json({ message: "Invalid user data" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc login user
//@route POST /api/auth/login
//@access Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
        avatar: user.avatar,
        token: generateToken(user._id),
        message: "User logged in successfully",
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc get current user
//@route GET /api/auth/me
//@access Private

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
        avatar: user.avatar,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc update user profile
//@route PUT /api/auth/me
//@access Private
exports.updateUserProfile = async (req, res) => {
  const { name, email, avatar } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.avatar = avatar || user.avatar;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isPro: updatedUser.isPro,
        avatar: updatedUser.avatar,
        message: "User profile updated successfully",
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
