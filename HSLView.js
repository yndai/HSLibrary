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

        // the card image popup (only 1 should exist)
        this.cardPopupDiv = null;

        // references to the bound event handlers (for removal purposes)
        this._boundCardRequestMouseOutListener = this._cardRequestMouseOutListener.bind(this);
        this._boundCardRequestMouseOverListener = this._cardRequestMouseOverListener.bind(this);

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
                cardRequest.addEventListener('mouseover', self._boundCardRequestMouseOverListener);
                cardRequest.addEventListener('mouseout', self._boundCardRequestMouseOutListener);
            });

        },


        /**
         * Called by model to update view
         * @param event
         */
        update: function(event) {
            console.log(event);
        },

        _showCardImageAtPosition: function(url, x, y) {

            // remove popup if it is still visible
            this._removeCardImage();

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

            this.cardPopupDiv = div;

            div.appendChild(img);
            document.body.appendChild(div);

        },

        _removeCardImage: function() {
            if (this.cardPopupDiv) {
                this.cardPopupDiv.parentNode.removeChild(this.cardPopupDiv);
                this.cardPopupDiv = null;
            }
        },

        _invalidateCardRequest: function(cardRequestSpan) {
            // remove class ID & event listeners from invalid
            // card request wrapper
            if (cardRequestSpan) {
                cardRequestSpan.classList.remove('hsl-card-request');
                cardRequestSpan.removeEventListener('mouseover', this._boundCardRequestMouseOverListener);
                cardRequestSpan.removeEventListener('mouseout', this._boundCardRequestMouseOutListener);
            }
        },

        _cardRequestMouseOverListener: function(e) {
            var self = this;
            var cardRequestSpan = e.target;
            var cardName = cardRequestSpan.getAttribute('data-card');
            // TODO: adjust coordinates based on amount of room to the left/right, etc
            var eventCoords = [e.pageX, e.pageY];

            var cardData = HSLCache.getCard(cardName);

            if (cardData === HSLCache.INVALID_CARD) {
                // card is invalid e.g. name was written incorrectly

                console.log('cached invalid card');
                this._invalidateCardRequest(cardRequestSpan);

            } else if (cardData) {
                // if cached card data is valid, just use that

                console.log('from cache');
                console.log(cardData);
                self._showCardImageAtPosition(cardData.img, eventCoords[0], eventCoords[1]);

            } else {
                // otherwise, request card data
                this.service.querySingleCard(cardName)
                    .then(function(data) {
                        var cardList = JSON.parse(data);
                        if (cardList && cardList.length > 0) {

                            // we take the first card as the best match
                            cardData = cardList[0];

                            // cache card data
                            HSLCache.addCard(cardName, cardList[0]);

                            console.log(data);

                            // display card popup
                            self._showCardImageAtPosition(cardList[0].img, eventCoords[0], eventCoords[1]);

                        } else {

                        }
                    })
                    .fail(function(error){
                        console.log(error);
                        // probably an invalid card name, cache null so we don't
                        // send another pointless request
                        HSLCache.addCard(cardName, HSLCache.INVALID_CARD);

                        self._invalidateCardRequest(cardRequestSpan);
                    });
            }

        },

        _cardRequestMouseOutListener: function(e) {
            // remove the floating card image if present
            this._removeCardImage();
        }

    });


    return {
        CommentsView : CommentsView
    };

})(HSLCache);
