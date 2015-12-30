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

    var state = 0;
    var bracketPosition = -1;

    var trie = new utils.Trie();

    trie.init(HSLTestCardNamesFull);

    // test for comment box listener
    var commentInput = document.querySelector('.usertext-edit textarea');
    commentInput.addEventListener('keyup', function(e) {
        var commentStr = e.target.value;
        if (commentStr.length < 2) {
            return;
        }
        var lastTwoChar = commentStr.substr(commentStr.length - 2);

        // TODO: need to be smarter, e.g. detect user has deleted the brackets, etc (listen to backspace??)
        if (state === 0 && lastTwoChar === '[[') {
            state = 1;
            bracketPosition = commentStr.length;
        } else if (state === 1 && lastTwoChar === ']]') {
            state = 0
            bracketPosition = -1;
        } else if (state === 1) {
            var cardRequest = commentStr.substr(bracketPosition);
            if (cardRequest.length > 0) {
                console.log(trie.findCompletions(cardRequest));
            }
        }
        console.log(state);
    });

    // TODO: pyromancer, wrath is not showing up...
    console.log(trie._root['w']);

    //console.log(trie.findCompletions("C"));

    //console.log(JSON.stringify(trie._root));

    //TODO: consider loading all cards at once (comment autocomplete feature?)... maybe store data in local storage? We can check for updates to data by checking against patch version number from API. This also means we can be smarter about card search...

})(
    HSLParser,
    HSLServices,
    HSLViews,
    HSLModels,
    HSLUtils
);