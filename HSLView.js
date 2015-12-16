'use strict';

var HSLViews = (function HSLView(HSLCache) {

    var BaseListenerView = function(model) {

        this.model = model;

        this.model.addListener(this);

    };
    _.extend(BaseListenerView.prototype, {

        /**
         * Initialize view in DOM (STUB)
         */
        init: function() {
        },

        /**
         * Called by model to update view (STUB)
         * @param event
         */
        update: function(event) {
            console.log(event);
        }

    });



    var CommentsView = function(model, parser, service) {
        BaseListenerView.apply(this, arguments);

        // TODO: eventually store comment nodes in model & listen to comment section changes

        this.parser = parser;

        this.service = service;

    };
    _.extend(CommentsView.prototype, BaseListenerView.prototype, {

        /**
         * Initialize comment thread view elements
         */
        init: function() {

            // parse comment section & wrap card requests
            this.parser.parse();

            // attach listeners to wrapped card requests
            this.addCardRequestListeners();

        },

        addCardRequestListeners: function() {
            var self = this;

            // list of wrapped card requests
            var cardRequests = document.querySelectorAll('.hsl-card-request');

            _.each(cardRequests, function(cardRequest) {

                // TODO: factor out event handler?
                cardRequest.addEventListener('mouseover', function(e) {

                    var cardName = cardRequest.getAttribute('data-card');

                    var cardData = HSLCache.getCard(cardName);
                    if (cardData) {
                        // if card data is cached, just use that

                        console.log('from cache');
                        console.log(cardData);

                    } else {
                        // otherwise, request card data

                        self.service.querySingleCard(cardName)
                            .then(function(data) {
                                var cardList = JSON.parse(data);
                                if (cardList && cardList.length > 0) {
                                    // we take the first card as the best match
                                    // cache card data
                                    HSLCache.addCard(cardName, cardList[0]);
                                    console.log(data);
                                }
                            })
                            .fail(function(error){
                                console.log('card not found');
                            });
                    }
                });
            });

        },

        /**
         * Called by model to update view
         * @param event
         */
        update: function(event) {
            console.log(event);
        },

        // TODO: insert a floating image @ position
        _floatImageAtPosition: function(url, x, y) {

        },

        _cardRequestMouseOverListener: function(e) {

        },

        _cardRequestMouseOutListener: function(e) {

        }

    });


    return {
        CommentsView : CommentsView
    };

})(HSLCache);
