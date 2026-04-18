const router = require("express").Router();
const Resource = require("../models/Resource");
const User = require("../models/User");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /\.(pdf|jpg|jpeg|png)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error("Only PDF, JPG, JPEG or PNG files are allowed"));
    }
    cb(null, true);
  }
});

router.post("/add", auth, upload.single("file"), async (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !req.file) {
    return res.status(400).json({ msg: "Title and file are required" });
  }

  const record = await Resource.create({
    title,
    description,
    category,
    owner: req.user.id,
    file: req.file.filename,
    status: "pending"
  });

  res.json(record);
});

router.get("/all", auth, async (req, res) => {
  const data = await Resource.find({ status: "available" }).populate("owner", "name department email");
  res.json(data);
});

router.get("/mine", auth, async (req, res) => {
  const data = await Resource.find({
    $or: [{ owner: req.user.id }, { requestedBy: req.user.id }]
  })
    .populate("owner", "name department email")
    .populate("requestedBy", "name department email")
    .sort({ createdAt: -1 });
  res.json(data);
});

router.post("/request/:id", auth, async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.status !== "available") {
    return res.status(400).json({ msg: "Resource is not available" });
  }

  if (resource.owner?.toString() === req.user.id) {
    return res.status(400).json({ msg: "You cannot request your own resource" });
  }

  resource.status = "requested";
  resource.requestedBy = req.user.id;
  await resource.save();

  res.json(resource);
});

router.post("/return/:id", auth, async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ msg: "Resource not found" });

  if (resource.requestedBy?.toString() !== req.user.id && resource.owner?.toString() !== req.user.id) {
    return res.status(403).json({ msg: "Not authorized to return this resource" });
  }

  resource.status = "available";
  resource.requestedBy = null;
  await resource.save();
  res.json(resource);
});

router.get("/allAdmin", auth, admin, async (req, res) => {
  const data = await Resource.find()
    .populate("owner", "name email department")
    .populate("requestedBy", "name email department")
    .sort({ createdAt: -1 });
  res.json(data);
});

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.equals) return value.toString();
  if (value._id && value._id !== value) return toIdString(value._id);
  if (value.toString) return value.toString();
  return null;
};

router.post("/approve/:id", auth, async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.status !== "requested") {
    return res.status(400).json({ msg: "Only requested items can be approved" });
  }

  const ownerId = toIdString(resource.owner);
  const isOwner = ownerId === req.user.id;
  const user = await User.findById(req.user.id);
  const isAdmin = user?.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ msg: "Not authorized to approve this request" });
  }

  resource.status = "borrowed";
  await resource.save();
  res.json(resource);
});

router.post("/owner/approve/:id", auth, async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.status !== "requested") {
    return res.status(400).json({ msg: "Only requested items can be approved" });
  }

  const ownerId = toIdString(resource.owner);
  if (ownerId !== req.user.id) {
    return res.status(403).json({ msg: "Not authorized to approve this request" });
  }

  resource.status = "borrowed";
  await resource.save();
  res.json(resource);
});

router.post("/approve-upload/:id", auth, admin, async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.status !== "pending") {
    return res.status(400).json({ msg: "Only pending uploads can be approved" });
  }

  resource.status = "available";
  await resource.save();
  res.json(resource);
});

router.post("/reject/:id", auth, async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.status !== "requested") {
    return res.status(400).json({ msg: "Only requested items can be rejected" });
  }

  const ownerId = toIdString(resource.owner);
  const requesterId = toIdString(resource.requestedBy);
  const isOwner = ownerId === req.user.id;
  const isRequester = requesterId === req.user.id;
  const user = await User.findById(req.user.id);
  const isAdmin = user?.role === "admin";
  if (!isOwner && !isAdmin && !isRequester) {
    return res.status(403).json({ msg: "Not authorized to reject this request" });
  }

  resource.status = "available";
  resource.requestedBy = null;
  await resource.save();
  res.json(resource);
});

router.post("/owner/reject/:id", auth, async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.status !== "requested") {
    return res.status(400).json({ msg: "Only requested items can be rejected" });
  }

  const ownerId = toIdString(resource.owner);
  if (ownerId !== req.user.id) {
    return res.status(403).json({ msg: "Not authorized to reject this request" });
  }

  resource.status = "available";
  resource.requestedBy = null;
  await resource.save();
  res.json(resource);
});

router.delete("/delete/:id", auth, admin, async (req, res) => {
  await Resource.findByIdAndDelete(req.params.id);
  res.json({ msg: "Resource deleted" });
});

router.use((error, req, res, next) => {
  res.status(400).json({ msg: error.message });
});

module.exports = router;
