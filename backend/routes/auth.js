const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  if (!email.toLowerCase().endsWith("@kongu.edu")) {
    return res.status(400).json({ msg: "Only kongu.edu email addresses are allowed" });
  }

  const exist = await User.findOne({ email: email.toLowerCase() });
  if (exist) return res.status(400).json({ msg: "User already exists" });

  const hash = await bcrypt.hash(password, 10);
  const role = email.toLowerCase() === "admin@kongu.edu" ? "admin" : "student";

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hash,
    department,
    role
  });

  res.json({
    msg: "Registered successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role
    }
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(400).json({ msg: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "7d" });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role
    }
  });
});

module.exports = router;