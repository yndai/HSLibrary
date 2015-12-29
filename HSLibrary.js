'use strict';

(function HSLibraryInit(
    parser,
    services,
    views,
    models
) {

    var commentsParser = new parser.CommentParser();

    var commentsModel = new models.CommentsModel();

    var hsService = new services.HSService();

    var commentsView = new views.CommentsView(commentsModel, commentsParser, hsService);

    commentsView.init();

    var state = 0;

    // test for comment box listener
    // TODO: maybe just include the brackets in the auto complete so we dont have to track them...
    var commentInput = document.querySelector('.usertext-edit textarea');
    commentInput.addEventListener('keyup', function(e) {
        var commentStr = e.target.value;
        if (commentStr.length < 2) {
            return;
        }
        var lastTwoChar = commentStr.substr(commentStr.length - 2);

        if (state === 0 && lastTwoChar === '[[') {
            state = 1;
        }
        if (state === 1 && lastTwoChar === ']]') {
            state = 0
        }

        console.log(state);
    });


    //TODO: consider loading all cards at once (comment autocomplete feature?)... maybe store data in local storage? We can check for updates to data by checking against patch version number from API. This also means we can be smarter about card search...

})(
    HSLParser,
    HSLServices,
    HSLViews,
    HSLModels
);