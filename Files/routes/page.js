// 요청에 따라 분기를 처리, 각 페이지에서 템플릿 엔진을 호출
const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag, Comment } = require('../models');
const { reset } = require('nodemon');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  res.locals.likes = req.user ? req.user.Liking.map(l => l.id) : [];
  next();
});

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: 'Profile - prj-name' });
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: 'Join to - prj-name' });
});

router.get('/login2', isNotLoggedIn, (req, res) => {
  res.render('login2', { title: 'Join to - prj-name' });
});

// 게시글 출력
router.get('/',isLoggedIn, async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
      order: [['createdAt', 'DESC']],
    });
    const comments = await Comment.findAll({
      order: [['createdAt', 'DESC']],
      include : {
        model : User,
        attributes : ['nick'],
        as : "Commenter",
      }
    });
    res.render('main', {
      title: 'prj-name',
      twits: posts,
      comments: comments,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 게시글 수정
router.get('/modify',isLoggedIn, async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        // attributes: ['id', 'nick'],
      },
      order: [['createdAt', 'DESC']],
    });
    const comments = await Comment.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.render('main', {
      title: 'prj-name',
      twits: posts,
      comments: comments,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post("/modify/:id", isLoggedIn, async (req, res, next) =>{
  console.log(req.body);
  try{
    const post = await Post.findOne({
      where : {id: req.params.id}
    });
    
    if (post){
      const mosdify = await post.update({
        content: req.body.content, 
      });
    }
    // #으로 시작해서 [ ]는 여러개 중 하나이고, ^는 부정, \s 는 띄어쓰기, 
    // #은 #, *는 모두, g는 모두 골라라라는 의미인데 정리하자면
    // #으로 시작해서 띄어쓰기랑 #이 아닌 애들을 모두를 골라라라는 의미입니다.
    const hashtags = req.body.content.match(/#[^\s#]*/g);
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map(tag => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          })
        }),
      );
      await post.addHashtags(result.map(r => r[0]));
    }
    res.redirect("/");
  } catch(error){
    console.error(error);
    next(error);
  }
});


// 해시태그 & 닉 검색 라우터
router.get('/hashtag', isLoggedIn, async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect('/');
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    const nick = await User.findOne({ where: { nick: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ 
        include: [{ model: User }],
        odder: [['createdAt', 'DESC']], 
      });
    }
    if (nick) {
      posts = await nick.getPosts({ 
        include: [{ model: User }],
        order: [['createdAt', 'DESC']],
       });
    }
    return res.render('main', {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// 댓글 라우터
router.post("/comment/:id", isLoggedIn, async (req, res, next) =>{
  console.log(req.body);
  try{
    const post = await Post.findOne({
      where : {id : req.params.id}
    });
    if (post){
      const comment = await Comment.create({
        content: req.body.content,
        CommenterId: req.user.id,
        postId : req.params.postId,
        UserId : req.body.userId,
      });
      await post.addComment(comment);
    }
    res.redirect("/");
  } catch(error){
    console.error(error);
    next(error);
  }
});

module.exports = router;
