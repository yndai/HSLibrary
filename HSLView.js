'use strict';

var HSLView = (function HSLView(models) {

    var BaseListenerView = function(model) {

        this.model = model;

        this.model.addListener(this);

    };
    _.extend(BaseListenerView.prototype, {

        /**
         * Initialize view in DOM (stub)
         */
        init: function() {
        },

        /**
         * Called by model to update view (stub)
         * @param event
         */
        update: function(event) {
            console.log(event);
        }

    });



    var CommentsView = function(model) {
        BaseListenerView.apply(this, arguments);

        this.commentsModel = model;

    };
    _.extend(CommentsView.prototype, BaseListenerView.prototype, {

        /**
         * Initialize view in DOM
         */
        init: function() {
        },

        /**
         * Called by model to update view
         * @param event
         */
        update: function(event) {
            console.log(event);
        }

    });


    return {
        CommentsView : CommentsView
    };

})(HSLModel);
