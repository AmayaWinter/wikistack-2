const express = require("express");
const router = express.Router();
const { Page, User } = require("../models");
const { userList, userPages } = require("../views");

// GET /users
router.get("/", async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.send(userList(users));
  } catch (error) {
    next(error);
  }
});

// GET /users/:userId
router.get("/:userId", async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {id: req.params.userId},
      include: [{model: Page}]
    });
    //original code
    // const pages = await Page.findAll({
    //   where: {
    //     authorId: req.params.userId
    //   }
    // });

    res.send(userPages(user, await user.getPages()));
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
