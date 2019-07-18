var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const validator = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
      .sort([['name', 'ascending']])
      .exec(function (err, list_genre) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('genre_list', { title: 'Genre List', genre_list: list_genre });
      });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', {title: 'Create New Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [

    //Validation
    validator.body('name', 'Genre Name Necessary').isLength({min: 2}).trim(),

    validator.sanitizeBody('name').escape(),

    //Main Processing

    (req, res, next) => {
        const errors = validator.validationResult(req);

        var genre = new Genre( {
            name: req.body.name
        });

        if(!errors.isEmpty()) {
            res.render('genre_form', {title: 'Create New Genre', genre: genre, errors: errors.array()});
            return;
        } else {
            Genre.findOne({'name': req.body.name})
            .exec(function(err, found_genre) {
                if(err) {
                    return next(err);
                }
                if(found_genre) {
                    res.redirect(found_genre.url);//if genre already exists
                } else {
                    genre.save(function (err) {
                        if(err) {
                            return next(err);
                        }

                        res.redirect(genre.url);
                    });
                }
            });
        }
    }

];
// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if(err) { 
            return next(err);
        }
        if(results.genre==null) {
            res.redirect('/catalog/genre');
        }

        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
    
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
          Genre.findById(req.body.genre).exec(callback)
        },
        genre_books: function(callback) {
          Book.find({ 'genre': req.body.genre }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.genre_books.length > 0) {
            // Genre has books. Render in same way as for GET route.
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
            return;
        }
        else {
            // Genre has no books. Delete object and redirect to the list of genres.
            Genre.findByIdAndRemove(req.body.genre, function deleteGenre(err) {
                if (err) { return next(err); }
                // Success - go to genre list
                res.redirect('/catalog/genres')
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};