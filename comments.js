var express = require("express");
var router = express.Router({ mergeParams: true});
var CampGround = require("../models/campground");
var Comment = require("../models/comment");

router.get("/new",isLoggedIn, function(req, res) {
    CampGround.findById(req.params.id,function(err,campground){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {campground: campground});
        }
    })
    
});

router.post("/",isLoggedIn,function(req,res){
   CampGround.findById(req.params.id,function(err, campground) {
      if(err){
          console.log(err);
      } else{
          Comment.create(req.body.comment,function(err,comment){
              if(err){
                  console.log(err);
              }else{
                  comment.author.id = req.user._id;
                  comment.author.username = req.user.username;
                  comment.save();
                  campground.comments.push(comment);
                  campground.save();
                  res.redirect("/campgrounds/" + campground._id);
                  
              }
          });
      }
   });
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
      return next();
  } 
  res.redirect("/login")
};
module.exports = router;