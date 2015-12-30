'use strict';

var HSLUtils = (function() {


    /**
     * A simple implementation of a Trie data structure for
     * searching of completions for word prefixes
     * @constructor
     */
    var Trie = function() {

        this._root = null;

    };
    _.extend(Trie.prototype, {

        init: function(wordList) {

            this._root = {};

            for (var i = 0; i < wordList.length; i++) {
                this.addWordToTrie(wordList[i]);
            }

        },

        addWordToTrie: function(word) {
            var letters = word.toLowerCase().split('');
            var currNode = this._root;

            for (var i = 0; i < letters.length; i++) {
                var letter = letters[i];
                var isEnd = (i === letters.length - 1);

                if (currNode[letter]) {
                    // continue traversal
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

        _findWordsIterative: function(node, foundWords, partial) {

            var curNode = node;
            var strStack = [];

            // TODO: look into an interative traveral

        },

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






    return {
        Trie: Trie
    };

})();
