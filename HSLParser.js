'use strict';

var HSLParser = (function() {

    var COMMENT_SELECTOR = ".usertext-body > div";

    var COMMENT_FILTER_REGEX = /\[\[([^\]]+)\]\]/g;

    var CARD_REQUEST_REGEX = /\[\[[^\]]+\]\]/g;

    /**
     * Returns list of matched capture groups
     * @param string
     * @param regex
     * @param index
     * @returns {Array}
     * @private
     */
    var _findRegexMatches = function(string, regex, index) {

        // default to the first capturing group
        index || (index = 1);

        var matches = [];
        var match;

        while (match = regex.exec(string)) {
            matches.push(match[index]);
        }

        return matches;
    };


    /**
     * A comment node with card requests
     * @param element: the node
     * @param cardNames: list of card names requested
     * @constructor
     */
    var CommentNode = function(element, cardNames) {

        this.element = element;

        this.cardNames = cardNames;

    };


    /**
     * Extraction of comment nodes
     * @constructor
     */
    var CommentParser = function() {

        this._commentNodeList = [];

    };
    _.extend(CommentParser.prototype, {

        /**
         * Returns copy of comment node list
         * @returns {Array}
         */
        getCommentNodeList: function() {

            return this._commentNodeList.slice(0);

        },

        /**
         * Parse page for comment bodies 
         */
        parse: function() {

            this._parseAndFilterComments();
            // TODO: requests may have already been wrapped... add a marker to the element or keep a map of marked elements
            this._wrapCardRequests();
        },

        /**
         * Wrap comment requests & trim square brackets
         * @private
         */
        _wrapCardRequests: function() {

            if (this._commentNodeList.length > 0) {

                _.each(this._commentNodeList, function(commentNode) {

                    if (commentNode.element.innerHTML) {
                        commentNode.element.innerHTML = commentNode.element.innerHTML
                            .replace(CARD_REQUEST_REGEX, function (match) {
                                // trim square brackets
                                var trimmedName = match.substr(2, match.length - 4);
                                return "<span class=\"hsl-card-request\" data-card=\"" + trimmedName + "\">" +
                                            trimmedName +
                                       "</span>";
                            });
                    }

                });

            }

        },

        /**
         * Parse the page for comment bodies & filter for comments with card requests;
         * Store elements in commentNodeList
         * @private
         */
        _parseAndFilterComments: function() {
            var self = this;

            this._commentNodeList = [];

            var foundCommentNodes = document.querySelectorAll(COMMENT_SELECTOR);

            if (foundCommentNodes.length > 0) {

                // filter out comments without card requests
                _.each(foundCommentNodes, function(commentNode) {

                    var matches = _findRegexMatches(commentNode.innerText, COMMENT_FILTER_REGEX, 1);

                    if (matches.length > 0) {

                        //console.log(commentNode.innerText + " %% " + JSON.stringify(matches));

                        self._commentNodeList.push(new CommentNode(commentNode,  matches));

                    }

                });

            }
        }

    });

    return {

        CommentParser : CommentParser

    };

})();
