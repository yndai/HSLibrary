'use strict';

var HSLUtils = (function() {

    /* ---------- LRU CACHE ---------- */

    /**
     * Doubly linked cache node
     *
     * @param key
     * @param value
     * @param newer
     * @param older
     * @constructor
     */
    var CacheEntry = function(key, value, newer, older) {
        this.key = key;
        this.value = value;
        this.newer = newer;
        this.older = older;
    };

    /**
     * LRU Cache impl. with map and linked list
     *
     * @param maxSize
     * @constructor
     */
    var LRUCache = function(maxSize) {
        this._front = null;
        this._back = null;
        this._itemMap = {};

        // enforce minimum max size of 2
        this._maxSize = maxSize >= 2 ? maxSize : 2;
        this._size = 0;
    };
    _.extend(LRUCache.prototype, {

        /**
         * Retrieve item from cache
         *
         * @param key
         * @returns {*|null}
         */
        getItem: function(key) {
            var entry = this._itemMap[key];
            if (entry) {
                this._moveToFront(entry);
                return entry.value;
            } else {
                return null;
            }
        },

        /**
         * Create cache entry, remove oldest entry if
         * limit exceeded
         *
         * @param key
         * @param value
         */
        putItem: function(key, value) {
            var entry = this._itemMap[key];
            if (entry) {
                // update value on collision
                entry.value = value;
                this._moveToFront(entry);
            } else {
                if (this._size === 0) {
                    this._front = new CacheEntry(key, value, null, null);
                    this._back = this._front;
                } else if (this._size === 1) {
                    this._back = this._front;
                    this._front = new CacheEntry(key, value, null, this._back);
                    this._back.newer = this._front;
                } else {
                    this._front = new CacheEntry(key, value, null, this._front);
                    this._front.older.newer = this._front;
                }

                this._itemMap[key] = this._front;
                this._size++;

                if (this._size > this._maxSize) {
                    this._prune();
                }
            }
        },

        /**
         * Get current number of elements in cache
         *
         * @returns {number}
         */
        getSize: function() {
            return this._size;
        },

        /**
         * Move cache entry to front
         *
         * @param entry
         * @private
         */
        _moveToFront: function(entry) {
            if (entry.newer) {
                entry.newer.older = entry.older;
                if (entry.newer.newer === null) {
                    entry.newer.newer = entry;
                }
            } else {
                return;
            }

            if (entry.older) {
                entry.older.newer = entry.newer;
            } else {
                this._back = entry.newer;
            }

            entry.newer = null;
            entry.older = this._front;
            this._front.newer = entry;
            this._front = entry;
        },

        /**
         * Removes the least recently used element in cache if
         * the limit has been exceeded
         *
         * @private
         */
        _prune: function() {
            if (this._size > this._maxSize) {
                var last = this._back;

                last.newer.older = null;

                this._back = last.newer;

                delete this._itemMap[last.key];

                last.newer = null;
                last.older = null;

                this._size--;
            }
        }

    });

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
        LRUCache: LRUCache,
        Trie: Trie,

        findAbsoluteOffset: findAbsoluteOffset,
        scrollElementIntoView: scrollIntoView,
        isKeyPrintable: isKeyPrintable,
        isKeyCharacter: isKeyCharacter
    };

})();
