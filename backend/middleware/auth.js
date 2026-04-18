const jwt = require("jsonwebtoken");

module.exports = function(req,res,next){
 const authHeader = req.headers["authorization"] || req.headers["Authorization"];
 if(!authHeader) return res.status(401).json({msg:"No token"});

 const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

 try{
  const decoded = jwt.verify(token,"secret");
  req.user = decoded;
  next();
 }catch{
  res.status(401).json({msg:"Invalid token"});
 }
};