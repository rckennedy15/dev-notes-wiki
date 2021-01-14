require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
app.set('view engine', 'ejs');
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);
app.use(express.static('public'));

/**********************REST API**********************/

mongoose.connect(
	`mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER}@cluster0.4isp2.mongodb.net/wikiDB?retryWrites=true&w=majority`,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
);

const articleSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, 'Error: a title is required'],
	},
	formattedTitle: String,
	content: String,
	categories: {
		type: Array,
		default: [],
	},
});

const Article = mongoose.model('Article', articleSchema);

app
	.route('/api/articles')
	.get((req, res) => {
		Article.find((err, foundArticles) => {
			err ? res.send(err) : res.send(foundArticles);
		});
	})
	.post((req, res) => {
		if (req.body.key === process.env.API_KEY) {
			const newArticle = new Article({
				title: _.replace(_.toLower(req.body.title), ' ', '-'),
				formattedTitle: req.body.title,
				content: req.body.content,
				// TODO add categories: {}
			});

			newArticle.save((err) => {
				err ? res.send(err) : res.send('Successfully added article!');
			});
			termLine();
			cl('Created new article:');
			cl('\tTitle: ' + _.replace(_.toLower(req.body.title), ' ', '-'));
			cl('\tFormatted Title: ' + req.body.title);
			cl('\tContent: ' + req.body.content);
			termLine();
		} else {
			res.send('Error: API key not valid');
		}
	})
	.delete((req, res) => {
		if (req.body.key === process.env.API_KEY) {
			Article.deleteMany((err) => {
				err ? res.send(err) : res.send('Successfully deleted all articles.');
			});
		} else {
			res.send('Error: API key not valid');
		}
	});

app
	.route('/api/articles/:articleTitle')
	.get((req, res) => {
		Article.findOne(
			{
				title: _.replace(_.toLower(req.params.articleTitle), ' ', '-'),
			},
			(err, result) => {
				err ? res.send(err) : res.send(result);
			}
		);
	})
	.put((req, res) => {
		if (req.body.key === process.env.API_KEY) {
			Article.update(
				{
					title: _.replace(_.toLower(req.params.articleTitle), ' ', '-'),
				},
				{
					title: _.replace(_.toLower(req.body.title), ' ', '-'),
					formattedTitle: req.body.title,
					content: req.body.content,
				},
				{
					overwrite: true,
				},
				(err, result) => {
					err ? res.send(err) : res.send('Successfully updated article');
				}
			);
		} else {
			res.send('Error: API key not valid');
		}
	})
	.patch((req, res) => {
		if (req.body.key === process.env.API_KEY) {
			Article.update(
				{
					title: _.replace(_.toLower(req.params.articleTitle), ' ', '-'),
				},
				{
					$set: req.body,
				},
				(err, result) => {
					err ? res.send(err) : res.send('Successfully updated article');
				}
			);
		} else {
			res.send('Error: API key not valid');
		}
	})
	.delete((req, res) => {
		if (req.body.key === process.env.API_KEY) {
			Article.deleteOne(
				{
					title: _.replace(_.toLower(req.body.title), ' ', '-'),
				},
				(err) => {
					err ? res.send(err) : res.send('Successfully deleted article');
				}
			);
		} else {
			res.send('Error: API key not valid');
		}
	});

/***********************SERVER***********************/

app.get('/', (req, res) => {
	res.render('home');
});

app.listen(process.env.PORT, () => {
	cl(`server started on port ${process.env.PORT}`);
});

/******************HELPER FUNCTIONS******************/

function cl(str) {
	console.log(str);
}

function termLine() {
	let termWidth = process.stdout.columns;
	termWidth > 0 ? cl('%'.repeat(termWidth)) : cl('%'.repeat(80));
}
