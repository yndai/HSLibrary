'use strict';

var HSLModels = (function() {

    /**
     * Generic listenable model
     *
     * @constructor
     */
    var BaseListenableModel = function() {
        this.listeners = [];
    };
    _.extend(BaseListenableModel.prototype, {

        /**
         * Add a listener if not already added
         *
         * @param listener
         */
        addListener: function(listener) {

            if (!_.contains(this.listeners, listener)) {

                this.listeners.push(listener);

            }

        },

        /**
         * Remove a listener if it exists
         *
         * @param listener
         */
        removeListener: function(listener) {

            this.listeners = _.without(this.listeners, listener);

        }

    });



    var CommentsModel = function() {
        BaseListenableModel.apply(this, arguments);

    };
    _.extend(CommentsModel.prototype, BaseListenableModel.prototype, {

    });



    var CardCollectionModel = function() {
        BaseListenableModel.apply(this, arguments);

        // card data cache
        this.cardCache = {};

    };
    _.extend(CardCollectionModel.prototype, BaseListenableModel.prototype, {

    });



    return {

        CommentsModel: CommentsModel,
        CardCollectionModel: CardCollectionModel

    };

})();