var CampGround = require("../models/campground");
var Comment = require("../models/comment");
var middlewareObj = {};

middlewareObj.isLoggedIn = function(req,res,next){
  if(req.isAuthenticated()){
      return next();
  } 
  req.flash("error", "you need to be logged in to do that");
  res.redirect("/login")
};

middlewareObj.checkCampgroundOwnership = function(req,res,next){
     if(req.isAuthenticated()){
        CampGround.findById(req.params.id, function(err, foundCampground){
          if(err || !foundCampground){
          console.log(err);
          req.flash('error', 'Sorry, that campground does not exist!');
          res.redirect('/campgrounds');
           }  else {
               // does user own the campground?
            if(foundCampground.author.id.equals(req.user._id)) {
                req.campground = foundCampground;
                next();
            } else {
                req.flash("error", "you are not allowed to do that");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "you need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function (req,res,next){
 if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err || !foundComment){
          console.log(err);
          req.flash('error', 'Sorry, that comment does not exist!');
          res.redirect('/campgrounds');
           }  else {
               // does user own the comment?
            if(foundComment.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "you are not allowed to do that");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "you need to be logged in to do that");
        res.redirect("back");
    }
}

module.exports = middlewareObj;
