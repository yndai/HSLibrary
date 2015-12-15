'use strict';

var HSLCache = (function() {

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

            return _size;

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
            }

            if (entry.older) {
                entry.older.newer = entry.newer;
            }

            entry.newer = null;
            entry.older = this._front;
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

            }

        }

    });

    /* ---------- Card data cache ---------- */

    var cardDataCache = new LRUCache(20);

    function addCard(name, cardData) {
        cardDataCache.putItem(name, cardData);
    }
    function getCard(name) {
        return cardDataCache.getItem(name);
    }

    return {

        addCard: addCard,
        getCard: getCard

    };

})();