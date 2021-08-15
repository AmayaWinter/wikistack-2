const express = require("express");
const router = express.Router();
const { db, Page, User, Tag, wikiNamespace } = require("../models");
const { main, addPage, editPage, wikiPage } = require("../views");
const {Op} = require('sequelize');


// GET /wiki
router.get("/", async (req, res, next) => {
  try {
    let pages;
    if(req.query.tag) {
      pages = await Page.findByTag(req.query.tag);
    }
    else {
      pages = await Page.findAll();
    }
    res.send(main(pages));
  } catch (error) {
    next(error);
  }
});

router.get("/:slug/similar", async (req, res, next) => {
  try {
    let pages = [];
    if(req.params.slug) {
      const page = await Page.findOne({
        where: {
          slug: req.params.slug
        },
        include: [{model: Tag}, {model: User, as: 'author'}]
      });
      pages = await page.findSimilar(req.params.slug);
    }
    res.send(main(pages));
  } catch (error) {
    next(error);
  }
});



// //GET /wiki/search
// router.get("/search", async (req, res, next) => {
//   try {
//     let pages = [];
//     if(req.query.search) {
//       pages = await Page.search(req.query.search);
//     }
//     res.send(main(pages));
//   } catch (error) {
//     next(error);
//   }
// });


// POST /wiki
router.post("/", async (req, res, next) => {
  const tagsArr = req.body.tags.split(' ');//.map(tag => {return {name: tag}})

  try {
    const page = await db.transaction( async wikiNamespace => {
      let dbTags = [];
      for(let i = 0; i < tagsArr.length; i++) {
        const [tag, wasCreated] = await Tag.findOrCreate(
          {
            where: {
              name: tagsArr[i]
            }
          }
        );
        dbTags.push(tag);
      }
      const [user, wasCreated] = await User.findOrCreate({
        where: {
          name: req.body.name,
          email: req.body.email
        }
      });
      const page = await Page.create(req.body);
      await page.addTags(dbTags);
      await page.setAuthor(user);
      return page;
    });
    res.redirect("/wiki/" + page.slug);
  } catch (error) {
    next(error);
  }
});

// POST /wiki/:slug
router.put("/:slug", async (req, res, next) => {
  try {
    const [updatedRowCount, updatedPages] = await Page.update(req.body, {
      where: {
        slug: req.params.slug
      },
      returning: true
    });

    res.redirect("/wiki/" + updatedPages[0].slug);
  } catch (error) {
    next(error);
  }
});

// DELETE /wiki/:slug
router.delete("/:slug", async (req, res, next) => {
  try {
    await Page.destroy({
      where: {
        slug: req.params.slug
      }
    });

    res.redirect("/wiki");
  } catch (error) {
    next(error);
  }
});

// GET /wiki/add
router.get("/add", (req, res) => {
  res.send(addPage());
});

// GET /wiki/:slug
router.get("/:slug", async (req, res, next) => {

  try {
    const page = await Page.findOne({
      where: {
        slug: req.params.slug
      },
      include: [{model: Tag}, {model: User, as: 'author'}]
    });

    if (!page) {
      res.sendStatus(404);
    } else {
      res.send(wikiPage(page ,page.author));
    }
  } catch (error) {
    next(error);
  }
});

// GET /wiki/:slug/edit
router.get("/:slug/edit", async (req, res, next) => {
  try {
    const page = await Page.findOne({
      where: {
        slug: req.params.slug
      }
    });
    if (page === null) {
      res.sendStatus(404);
    } else {
      const author = await page.getAuthor();
      res.send(editPage(page, author));
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
