const html = require("html-template-tag");
const layout = require("./layout");
const marked = require('marked');

module.exports = (page, author) => layout(html`
  <h3>${page.title}
    <small> (<a href="/wiki/${page.slug}/similar">Similar</a>)</small>
  </h3
  <h4>by <a href="/users/${author.id}">${author.name}</a></h4>
  <hr/>
  <div class="page-body">$${marked(page.content)}</div>
  <hr/>
  <ul>
    ${page.tags.map(tag => html`<li>${tag.name}</li>`)}
  </ul>
  <a href="/wiki/${page.slug}/edit" class="btn btn-primary">edit this page</a>
  <form style='display:inline' method='POST' action='/wiki/${page.slug}?_method=DELETE'>
  <button class="btn btn-danger">delete this page</button>
  </form>
`);
