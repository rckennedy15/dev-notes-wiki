require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const https = require('https');

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
	parentID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Article',
	},
	parent: String,
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
			Article.findOne({ formattedTitle: req.body.parent }, (err, result) => {
				if (err) {
					cl(err);
					res.send('Error: cannot find parent');
				} else {
					var pID;
					if (req.body.parent === '1') {
						pID = '1';
					} else {
						pID = result._id;
					}
					const newArticle = new Article({
						title: _.replace(_.toLower(req.body.title), ' ', '-'),
						formattedTitle: req.body.title,
						content: req.body.content,
						parent: req.body.parent,
						parentID: pID,
					});

					newArticle.save((err) => {
						err ? res.send(err) : res.send('Successfully added article!');
					});
				}
			});

			termLine();
			cl('Created new article:');
			cl(`\tTitle: 						${_.replace(_.toLower(req.body.title), ' ', '-')}`);
			cl(`\tFormatted Title: 	${req.body.title}`);
			cl(`\tContent: 					${req.body.content}`);
			cl(`\tParent: 					${req.body.parent}`);
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
	// DEPRECATED
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
	// TODO ADD CATEGORIES

	res.render('home', {
		article: false,
		formattedTitle: 'Test',
		content: 'ajsdhjklash aslkdh lksahd lksdh ',
	});
});

// switch to actually use API instead of directly searching database
app.get('/articles/:articleTitle', (req, res) => {
	const title = req.params.articleTitle;
	// Article.findOne({ title: title }, (err, result) => {
	// 	if (err) {
	// 		res.send('404 :(');
	// 	} else {
	// 		res.render('home', {
	// 			article: true,
	// 			formattedTitle: result.formattedTitle,
	// 			content: result.content,
	// 		});
	// 	}
	// });

	// DONT ACTUALLY DO THIS
	// ACCESS API ROUTE WITHOUT MAKING AN HTTPS REQUEST
	https
		.get(process.env.API_URL + ':' + process.env.PORT, (res) => {
			console.log(res.title);

			res.on('data', (d) => {
				process.stdout.write(d);
			});
		})
		.on('error', (e) => {
			console.error(e);
		});
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
