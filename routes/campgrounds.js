var express = require("express");
var router = express.Router();
var CampGround = require("../models/campground");
var middlewareObj = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'talyb', 
  api_key: 353873297982814, 
  api_secret: "slFKbEiLGgJOCPw9qTytVTMpDW4"
});


router.get("/",function(req,res){
    CampGround.find({},function(err, allCampgrounds){
        if(err){
            console.log(err)
        } else {
                res.render("campgrounds/index", {campGrounds: allCampgrounds});  
        }
    });
});
router.get("/new", middlewareObj.isLoggedIn,function(req,res){
   res.render("campgrounds/new");
});

router.post("/", middlewareObj.isLoggedIn, upload.single('image'), function(req, res) {
cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
  // add cloudinary url for the image to the campground object under image property
  req.body.campground.image = result.secure_url;
  
  req.body.campground.imageId = result.public_id;
  // add author to campground
  req.body.campground.author = {
    id: req.user._id,
    username: req.user.username
  }
  CampGround.create(req.body.campground, function(err, campground) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect('/campgrounds/' + campground.id);
  });
});
});

 

router.get("/:id",function(req, res) {
    CampGround.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
         if(err || !foundCampground){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            return res.redirect('/campgrounds'); 
        }else{
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//edit and update

router.get("/:id/edit", middlewareObj.checkCampgroundOwnership, function(req, res) {
   res.render("campgrounds/edit", {campground: req.campground});
});


router.put("/:id",middlewareObj.checkCampgroundOwnership, upload.single('image'), function(req, res){
    CampGround.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

//delete campground
router.delete('/:id',middlewareObj.checkCampgroundOwnership, function(req, res) {
  CampGround.findById(req.params.id, async function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(campground.imageId);
        campground.remove();
        req.flash('success', 'Campground deleted successfully!');
        res.redirect('/campgrounds');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

module.exports = router;