const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.options(/.*/, cors({ origin: true, credentials: true }));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


mongoose.connect("mongodb://127.0.0.1:27017/campus")
  .then(async () => {
    console.log("MongoDB Connected: campus");

    const adminEmail = "admin@kongu.edu";
    const adminPassword = "Admin@123";
    let existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: "Campus Admin",
        email: adminEmail,
        password: hashed,
        department: "Administration",
        role: "admin"
      });
      console.log(`Default admin created: ${adminEmail} / ${adminPassword}`);
    } else {
      const hashed = await bcrypt.hash(adminPassword, 10);
      existingAdmin.password = hashed;
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log(`Admin password reset: ${adminEmail} / ${adminPassword}`);
    }
  })
  .catch(err => console.log(err));


app.use("/api/auth", require("./routes/auth"));
app.use("/api/resources", require("./routes/resource"));   

app.listen(5000, () => console.log("Server running on port 5000"));