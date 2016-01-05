'use strict';

var HSLUtils = (function() {

    /* ---------- TRIE ---------- */

    /**
     * A simple implementation of a Trie data structure for
     * searching completions for word prefixes
     * @constructor
     */
    var Trie = function() {

        this._root = {};

    };
    _.extend(Trie.prototype, {

        /**
         * Initialize trie with a list of strings
         * @param wordList
         */
        init: function(wordList) {

            for (var i = 0; i < wordList.length; i++) {
                this.addWordToTrie(wordList[i]);
            }

        },

        /**
         * Store a word in the tree ( will be converted to lower case )
         * @param word
         */
        addWordToTrie: function(word) {

            var letters = word.toLowerCase().split('');
            var currNode = this._root;

            for (var i = 0; i < letters.length; i++) {
                var letter = letters[i];
                var isEnd = (i === letters.length - 1);

                if (currNode[letter]) {
                    // node exists
                    currNode = currNode[letter];
                    if (isEnd) {
                        currNode._end = true;
                    }
                } else {
                    // node does not exist yet
                    if (isEnd) {
                        currNode[letter] = { _end: true };
                    } else {
                        currNode[letter] = {};
                    }
                    currNode = currNode[letter];
                }

            }
        },

        // TODO: find a way to optimize this? maybe cache completions at nodes?
        /**
         * Find all completions for a given prefix
         * @param partial
         * @returns {Array}
         */
        findCompletions: function(partial) {
            var currNode = this._root;
            var letters = partial.toLowerCase().split('');
            var completions = [];

            // traverse to end of partial
            for (var i = 0; i < letters.length; i++) {
                var letter = letters[i];
                currNode = currNode[letter];
                if (!currNode) {
                    return [];
                }
            }

            this._findWords(currNode, completions, partial.toLowerCase());

            return completions;
        },

        /**
         * Recursive traversal of Trie structure to find completions for a
         * word
         * @param node
         * @param foundWords
         * @param partial
         * @private
         */
        _findWords: function(node, foundWords, partial) {

            if (node._end) {
                foundWords.push(partial);
            }

            for (var child in node) {
                if (node.hasOwnProperty(child) && child !== '_end') {
                    this._findWords(node[child], foundWords, partial + child);
                }
            }

        }

    });

    /* ---------- MISC ---------- */

    /**
     * Utility method for finding the absolute position
     * of an element
     * @param element
     * @returns {Number[]}
     */
    var findAbsoluteOffset = function (element) {
        var top = 0;
        var left = 0;

        // Need to traverse through parents to add up all offsets
        // since each node only stores its relative offsets
        // See http://www.quirksmode.org/js/findpos.html
        if (element && element.offsetParent) {
            do {
                top += element.offsetTop;
                left += element.offsetLeft;
            } while(element = element.offsetParent);
        }

        return [left, top];
    };

    return {
        Trie: Trie,

        findAbsoluteOffset: findAbsoluteOffset
    };

})();
