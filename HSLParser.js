'use strict';

var HSLParser = (function() {

    var COMMENT_SELECTOR = '.usertext-body > div';

    var COMMENT_FILTER_REGEX = /\[\[([^\]]+)\]\]/g;

    var CARD_REQUEST_REGEX = /\[\[[^\]]+\]\]/g;

    // a "list" of cards we don't want to attempt to retrieve data for
    var IGNORE_CARDS = {
        // commonly used by the hs card bot in its comments
        'cardname' : 1
    };

    /**
     * Returns list of matched capture groups
     * @param string
     * @param regex
     * @param index     ( index of the capture group; defaults to 1 )
     * @param findFirst ( optional; if true, will return list with just the first match )
     * @returns {Array}
     * @private
     */
    var _findMatches = function(string, regex, index, findFirst) {

        // default to the first capturing group
        if (!index || index < 0) {
            index = 1;
        }

        var matches = [];
        var match;

        if (findFirst) {
            if (match = regex.exec(string)) {
                matches.push(match[index]);
            }
        } else {
            while (match = regex.exec(string)) {
                matches.push(match[index]);
            }
        }

        // Note: regex given may have a global modifier
        // and thus is stateful; need to reset the lastIndex in
        // that case!
        regex.lastIndex = 0;

        return matches;
    };

    /**
     * A comment node with card requests
     * @param element        ( the node )
     * @param cardNames      ( list of card names requested )
     * @param cardReqNodeMap ( map from card name to the card request node ( multiple if 1 card is repeated ) )
     * @constructor
     */
    var CommentNode = function(element, cardNames, cardReqNodeMap) {
        this.element = element;
        this.cardNames = cardNames || [];
        this.cardReqNodeMap = cardReqNodeMap || {};
    };


    /**
     * For finding comment nodes with card requests
     * @constructor
     */
    var CommentParser = function() {
    };
    _.extend(CommentParser.prototype, {

        /**
         * Parse whole page for comment bodies with card requests
         * @returns {Array} - List of nodes that contains card requests
         */
        parseAll: function() {
            return this.parseNode(document.body);
        },

        /**
         * Parse a node for comment bodies with card reqeusts
         * @param {Element} node - root node to begin searching for card requests
         * @returns {Array} - List of nodes that contains card requests
         */
        parseNode: function(node) {
            var commentNodes = node.querySelectorAll(COMMENT_SELECTOR);
            var commentNodeList = this._parseAndFilterComments(commentNodes);
            commentNodeList = this._wrapCardRequestsInDOM(commentNodeList);
            return commentNodeList;
        },

        /**
         * Wrap card requests in comment DOM;
         * attaches wrapper node references to comment nodes given;
         * filter out ignored card requests
         * @param commentNodeList
         * @returns {Array}
         * @private
         */
        _wrapCardRequestsInDOM: function(commentNodeList) {

            if (commentNodeList.length > 0) {

                // insert card request wrappers in comment body DOM
                _.each(commentNodeList, function(commentNode) {
                    if (commentNode.element.innerHTML) {
                        commentNode.element.innerHTML = commentNode.element.innerHTML
                            .replace(CARD_REQUEST_REGEX, function (match) {
                                // trim square brackets
                                var trimmedName = match.substr(2, match.length - 4);

                                if (IGNORE_CARDS[trimmedName]) {
                                    return match;
                                } else {
                                    return "<span class=\"hsl-card-request\" data-card=\"" + trimmedName + "\">" +
                                                trimmedName +
                                            "</span>";
                                }
                            });

                        // save references to new wrapped card requests
                        var wrappedReqNodes = commentNode.element.querySelectorAll('.hsl-card-request');
                        _.each(wrappedReqNodes, function(reqNode) {
                            var cardName = reqNode.getAttribute('data-card');
                            if (commentNode.cardReqNodeMap[cardName]) {
                                // more than 1 request for a card
                                commentNode.cardReqNodeMap[cardName].push(reqNode);
                            } else {
                                commentNode.cardReqNodeMap[cardName] = [reqNode];
                            }
                        });
                    }
                });

                // filter out ignored card requests
                commentNodeList = _.filter(commentNodeList, function(commentNode) {
                    // ignored card requests do not have any associated card request wrappers
                    // so just check for that
                    return !_.isEmpty(commentNode.cardReqNodeMap);
                })

            }

            return commentNodeList;
        },

        /**
         * Parse a node list for comment bodies & filter for comments with card requests
         * @param {NodeList} nodeList
         * @returns {Array}
         * @private
         */
        _parseAndFilterComments: function(nodeList) {

            var commentNodeList = [];

            if (nodeList && nodeList.length > 0) {

                // filter out comments without card requests
                _.each(nodeList, function(commentNode) {

                    var matches = _findMatches(commentNode.innerText, COMMENT_FILTER_REGEX, 1, true);
                    if (matches.length > 0) {

                        //console.log(commentNode.innerText + " %% " + JSON.stringify(matches));
                        commentNodeList.push(new CommentNode(commentNode, matches, {}));
                    }
                });
            }

            return commentNodeList;
        }

    });

    return {
        CommentNode : CommentNode,
        CommentParser : CommentParser
    };

})();
