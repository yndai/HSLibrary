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

    //TODO: consider loading all cards at once (comment autocomplete feature?)... maybe store data in local storage?
    // TODO: check for updates to data by checking against patch version number from API

    // TODO: use mutation observer to listen to inserted comments and do a new parse after..
    var target = document.querySelector('.morecomments');

    // create an observer instance
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            console.log(mutation);
        });
    });

// configuration of the observer:
    var config = { childList: true, subtree: true };

// pass in the target node, as well as the observer options
    observer.observe(target, config);


})(
    HSLParser,
    HSLServices,
    HSLViews,
    HSLModels
);