import express from "express";
import path from 'path';
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import { faqs } from './faqs.js';
import { blogPosts } from "./blogposts.js";


const app = express()
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render("index", {
    blogPosts: blogPosts,
    faqs: faqs,
  })
})

app.get('/budget', (req, res) => {
  res.render("budget")
})

app.get('/investments', (req, res) => {
  res.render("investments")
})

app.get('/savings', (req, res) => {
  res.render("savings")
})

app.get('/debts', (req, res) => {
  res.render("debts")
})

app.get("/article/:id", (req, res) => {
  const articleId = req.params.id;
  const selectedPost = blogPosts.find(p => p.id.toString() === articleId);

  if (!selectedPost) {
    return res.status(404).send("Article not found");
  }
  res.render("articles", {
    post: selectedPost,
    blogPosts,
  })
});


app.get('/about', (req, res) => {
  res.render("about")
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`)
})

