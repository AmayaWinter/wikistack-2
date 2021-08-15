const cls = require('cls-hooked');
const Sequelize = require("sequelize");
const wikiNamespace = cls.createNamespace('wikiNamespace');
Sequelize.useCLS(wikiNamespace);
const pd = require('pretty-data').pd;
const db = new Sequelize("postgres://localhost:5432/wikistack", {
  logging: false
});

const Page = db.define("page", {
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING,
    allowNull: false,
    //since we are searching, editing, deleting by slug, these need to be unique
    unique: true
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  brandy: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.ENUM("open", "closed")
  }
});

Page.beforeValidate((page) => {
  /*
   * Generate slug
   */
  if (!page.slug) {
    page.slug = page.title.replace(/\s/g, "_").replace(/\W/g, "").toLowerCase();
  }
});



const User = db.define("user", {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    isEmail: true,
    allowNull: false
  }
});

const Tag =  db.define('tag', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  }
});



Page.findByTag = async function(tag) {
  return Page.findAll({
    include: {
      model: Tag,
      where: {
        name: {
          [Sequelize.Op.substring]: tag
        }
      }
    }
  });
}


Page.prototype.findSimilar = async function() {
  let tagsObjs = this.tags ? this.tags : this.getTags();
  const tags = tagsObjs.map(tagObj => tagObj.name);
  console.log(tags);

  return Page.findAll({
    include: [
      {
        model: Tag,
        where: {
          name: {
            [Sequelize.Op.in]: tags
          }
        }
      }
    ],
    where: {
      id: {
        [Sequelize.Op.ne]: this.id
      }
    }
  });
}


// Page.findSimilar = async function(slug) {
//   console.log(slug)
//   const page = await Page.findOne({
//     where: {
//       slug: slug
//     },
//     include: [{
//       model: Tag,
//       attributes:['name'],
//       through: {
//         attributes: {
//           exclude: ['createdAt']
//         }
//       }
//     }],
//     logging: (sql => {
//       console.log(pd.sql(sql));
//     })
//
//
//   });
//   let tags = page.tags.map(tagObj => tagObj.name);
//   console.log(tags);
//   process.exit(0);
//   return Page.findAll({
//     include: [
//       {
//         model: Tag,
//         where: {
//           name: {
//             [Sequelize.Op.in]: tags
//           }
//         }
//       }
//     ]
//   });
//
// }


//This adds methods to 'Page', such as '.setAuthor'. It also creates a foreign key attribute on the Page table pointing ot the User table
Page.belongsTo(User, { as: "author" });
User.hasMany(Page, {foreignKey: 'authorId'});

Tag.belongsToMany(Page, {through: 'page_tag_join'});
Page.belongsToMany(Tag, {through: 'page_tag_join'});

module.exports = {
  db,
  Page,
  User,
  Tag,
  wikiNamespace
};
