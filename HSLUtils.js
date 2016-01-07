'use strict';

var HSLUtils = (function() {

    /* ---------- TRIE ---------- */

    // TODO: write tests !!

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

        // TODO: maybe optimize this? maybe cache completions at nodes?
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
    var findAbsoluteOffset = function(element) {
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


    var scrollIntoView = function(container, element) {
        var scrollBottomDiff = (element.offsetTop + element.offsetHeight) - (container.scrollTop + container.offsetHeight);
        var scrollTopDiff = element.offsetTop - container.scrollTop;
        if (scrollBottomDiff > 0) {
            container.scrollTop += scrollBottomDiff;
        } else if (scrollTopDiff > 0) {
            container.scrollTop += scrollTopDiff;
        }
    };

    /**
     * True if key pressed affects text in some way
     * @param keycode
     * @returns {boolean}
     */
    var isKeyPrintable = function(keycode) {
        return keycode === 8 || // backspace
            keycode === 32   || // spacebar
            keycode === 13   || // return
            isKeyCharacter(keycode);
    };

    /**
     * True if key pressed actually prints a character
     * @param keycode
     * @returns {boolean}
     */
    var isKeyCharacter = function(keycode) {
        return (keycode > 47 && keycode < 58) || // number keys
            (keycode > 64 && keycode < 91)    || // letter keys
            (keycode > 95 && keycode < 112)   || // numpad keys
            (keycode > 185 && keycode < 193)  || // ;=,-./` (in order)
            (keycode > 218 && keycode < 223);    // [\]' (in order)
    };

    return {
        Trie: Trie,

        findAbsoluteOffset: findAbsoluteOffset,
        scrollElementIntoView: scrollIntoView,
        isKeyPrintable: isKeyPrintable,
        isKeyCharacter: isKeyCharacter
    };

})();
