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
        },

        /**
         * Notify listeners of event and data (if applicable)
         * @param event
         * @param data
         */
        notify: function(event, data) {
            _.each(this.listeners, function(listener) {
                listener.update(event,data);
            })
        }

    });


    /**
     * For storing a list of references to comment nodes which contain card requests
     * @constructor
     */
    var CommentsModel = function() {
        BaseListenableModel.apply(this, arguments);

        this.COMMENT_NODES_ADDED_EVENT = 'evt_comments_added';

        this._commentNodes = [];

    };
    _.extend(CommentsModel.prototype, BaseListenableModel.prototype, {

        /**
         * Add comment nodes to model, notifies listeners
         * @param commentNodes
         */
        addCommentNodes: function(commentNodes) {

            this._commentNodes.push(commentNodes);

            // notify view with nodes that were added
            this.notify(this.COMMENT_NODES_ADDED_EVENT, commentNodes);

        }

    });


    // TODO: eventually implement extension options and store options here?
    // TODO: look into extension Message Passing to exchange messages b/w this content script and the actual extension script
    var HSLOptionsModel = function() {
        BaseListenableModel.apply(this, arguments);


    };
    _.extend(HSLOptionsModel.prototype, BaseListenableModel.prototype, {

    });



    return {

        CommentsModel: CommentsModel,
        HSLOptionsModel: HSLOptionsModel

    };

})();