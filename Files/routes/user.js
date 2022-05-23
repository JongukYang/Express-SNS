const express = require('express');

const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');
const Post = require('../models/post');

const router = express.Router();

// 팔로우 하기
router.post('/:id/follow', async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.addFollowing(parseInt(req.params.id, 10));
      res.send('success');
    } else {
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 언팔하기 
router.post('/:id/notfollow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (user) {
      await user.removeFollower(parseInt(req.user.id));
      res.send('success');
    } 
  } catch (error) {
    console.error(error);
    next(error);
  }
});


module.exports = router;