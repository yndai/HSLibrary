'use strict';

(function HSLibraryInit(
    parser,
    services,
    views,
    models
) {

    document.body.style.backgroundColor = "yellow";

    var commentsParser = new parser.CommentParser();

    var commentsModel = new models.CommentsModel();

    var hsService = new services.HSService();

    var commentsView = new views.CommentsView(commentsModel, commentsParser, hsService);

    commentsView.init();

    //TODO: consider loading all cards at once (comment autocomplete feature?)... maybe store data in local storage?



})(
    HSLParser,
    HSLServices,
    HSLViews,
    HSLModels
);