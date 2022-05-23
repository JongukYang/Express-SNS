const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag, User } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

// 이미지 업로드용
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 데베에 이미지url 저장
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

// 게시글 생성
const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    console.log(req.user);
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
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
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});



// 게시글 삭제
router.delete("/:postId/del", async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: {
        id: req.params.postId,
      },
    });
    if (post) {
      post.destroy({ post });
      res.status = 200;
      res.json({
        result: "deleted",
      });
    } else {
      res.status = 404;
      res.json({
        result: "post not found",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});


// 좋아요 추가
router.post('/:id/likes', isLoggedIn, async (req, res, next) => {
  console.log("request")
  console.log(req.body)
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.addLiking(parseInt(req.params.id));
      res.send('success');
    } else {
      res.status(404).send('no post');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 좋아요 삭제
router.delete('/:id/likes', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.removeLiking(parseInt(req.params.id));
      res.send('success');
    } else {
      res.status(404).send('no post');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});
module.exports = router;
