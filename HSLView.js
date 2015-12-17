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

                // set mouse event handlers (bound to this context)
                cardRequest.addEventListener('mouseover', self._cardRequestMouseOverListener.bind(self));
                cardRequest.addEventListener('mouseout', self._cardRequestMouseOutListener.bind(self));
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

            var div = document.createElement('div');
            var img = document.createElement('img');

            // TODO: consider compiling all ID's / Classnames in separate file
            div.id = 'hsl-card-img';
            div.style.left = x + 'px';
            div.style.top = y + 'px';
            img.src = url;

            //TODO: scale with browser size
            img.style.width = "50%";
            img.style.height = "50%";


            div.appendChild(img);
            document.body.appendChild(div);

        },

        _removeFloatingImage: function() {

            // TODO: remove the floating image (maybe make it a class variable...)
        },

        _cardRequestMouseOverListener: function(e) {
            var self = this;
            var cardRequest = e.target;
            var cardName = cardRequest.getAttribute('data-card');

            var cardData = HSLCache.getCard(cardName);
            if (cardData) {
                // if card data is cached, just use that

                console.log('from cache');
                console.log(cardData);

                // TODO: adjust coordinates based on amount of room to the left/right, etc
                self._floatImageAtPosition(cardData.img, e.pageX, e.pageY);

            } else {
                // otherwise, request card data

                this.service.querySingleCard(cardName)
                    .then(function(data) {
                        var cardList = JSON.parse(data);
                        if (cardList && cardList.length > 0) {
                            // we take the first card as the best match
                            // cache card data
                            HSLCache.addCard(cardName, cardList[0]);
                            console.log(data);
                            self._floatImageAtPosition(cardList[0].img, e.pageX, e.pageY);
                        }
                    })
                    .fail(function(error){
                        console.log(error);
                    });
            }

        },

        _cardRequestMouseOutListener: function(e) {

            // remove the floating card image if present
            var cardImg = document.querySelector('#hsl-card-img');
            if (cardImg) {
                cardImg.parentNode.removeChild(cardImg);
            }

        }

    });


    return {
        CommentsView : CommentsView
    };

})(HSLCache);
