'use strict';

(function HSLibraryInit(
    parser,
    services,
    views,
    models,
    utils
) {

    var commentsParser = new parser.CommentParser();

    var commentsModel = new models.CommentsModel();

    var hsService = new services.HSService();

    var commentsView = new views.CommentsView(commentsModel, commentsParser, hsService);

    commentsView.init();

    //TODO: consider loading all cards at once (comment autocomplete feature?)... maybe store data in local storage? We can check for updates to data by checking against patch version number from API. This also means we can be smarter about card search...

})(
    HSLParser,
    HSLServices,
    HSLViews,
    HSLModels,
    HSLUtils
);