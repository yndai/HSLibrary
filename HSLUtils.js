'use strict';

var HSLUtils = (function() {

    /*
        ----- Generic LRU Cache -----
     */

    var CacheEntry = function(key, value, newer, older) {

        this.key = key;
        this.value = value;
        this.newer = newer;
        this.older = older;

    };

    var LRUCache = function(maxSize) {

        this._head = null;

        this._tail = null;

        this._itemMap = {};

        // minimum max size is 2
        this._maxSize = maxSize > 1 ? maxSize : 2;

        this._size = 0;

    };
    _.extend(LRUCache.prototype, {

        /**
         *
         * @param key
         * @returns {*}
         */
        getItem: function(key) {

            var entry = this._itemMap[key] || null;

            if (entry) {

                this._moveToFront(entry);

            }

            return entry;
        },

        /**
         *
         * @param key
         * @param value
         */
        putItem: function(key, value) {

            var entry = this._itemMap[key];

            if (entry) {

                // update value
                entry.value = value;

                this._moveToFront(entry);

            } else {

                if (this._size === 0) {

                    this._head = new CacheEntry(key, value, null, null);
                    this._tail = this._head;

                } else if (this._size === 1) {

                    this._tail = this._head;
                    this._head = new CacheEntry(key, value, null, this._tail);
                    this._tail.newer = this._head;

                } else {

                    this._head = new CacheEntry(key, value, null, this._head);
                    this._head.older.newer = this._head;

                }

                this._itemMap[key] = this._head;
                this._size++;

                if (this._size > this._maxSize) {
                    this._prune();
                }

            }

        },

        /**
         * Get current number of elements in cache
         * @returns {number}
         */
        getSize: function() {

            return _size;

        },

        /**
         *
         * @param entry
         * @private
         */
        _moveToFront: function(entry) {

            if (entry.newer) {
                entry.newer.older = entry.older;
            }

            if (entry.older) {
                entry.older.newer = entry.newer;
            }

            entry.newer = null;
            entry.older = this._head;
            this._head = entry;

        },

        /**
         * Removes the least recently used element in cache if
         * the limit has been exceeded
         * @private
         */
        _prune: function() {

            if (this._size > this._maxSize) {

                var last = this._tail;

                last.newer.older = null;

                this._tail = last.newer;

                delete this._itemMap[last.key];

                last.newer = null;
                last.older = null;

            }

        }

    });

    /*
        ----- Other Utility Methods -----
     */


    return {

        LRUCache: LRUCache

    };

})();
