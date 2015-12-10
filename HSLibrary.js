'use strict';

(function HSLibraryInit(model) {

    document.body.style.backgroundColor = "yellow";

    var parser = new HSLParser.CommentParser();

    parser.parse();

    document.HSL_parser = parser;

})(HSLModel);