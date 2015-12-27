'use strict';

var HSLViews = (function HSLView(
    HSLCache
) {

    var HTTP_PREFIX_REGEX = /^http:\/\//i;

    var CARD_POPUP_TIMEOUT_MS = 300;

    var BaseListenerView = function(model) {

        this.model = model;

        this.model.addListener(this);

    };
    _.extend(BaseListenerView.prototype, {

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

        this.model = model;
        this.parser = parser;
        this.service = service;

        // the card image popup (only 1 should exist)
        this._cardPopupDiv = null;
        // timeout for removing the card popup
        this._popupTimeout = null;

        // mutation observer to listen to newly added comment nodes
        this._newCommentObserver = null;

        // references to the bound event handlers (for removal purposes)
        this._boundCardRequestMouseOutListener = this._cardRequestMouseOutListener.bind(this);
        this._boundCardRequestMouseOverListener = this._cardRequestMouseOverListener.bind(this);

        // hook up model
        this.model.addListener(this);

    };
    _.extend(CommentsView.prototype, BaseListenerView.prototype, {

        /**
         * Initialize comment thread view elements
         */
        init: function() {

            // parse entire comment section & wrap card requests
            var commentNodes = this.parser.parseAll();

            // add comment nodes to model
            this.model.addCommentNodes(commentNodes);

            // attach listener to trigger when new comment nodes are added so we
            // can update the model at that time
            this._addNewCommentListener();

        },

        /**
         * Called by model to update view on data changes
         * @param event
         * @param data
         */
        update: function(event, data) {
            console.log(event);

            // get a flat list of card request nodes that were
            // inserted into the DOM by the parser
            var cardRequestNodes = [];
            _.each(data, function(commentNode) {
                Array.prototype.push.apply(cardRequestNodes, _.values(commentNode.cardReqNodeMap));
            });

            // attach event listeners to request nodes
            this._addCardRequestListeners(cardRequestNodes);

        },

        _addCardRequestListeners: function(cardRequestNodes) {
            var self = this;

            _.each(cardRequestNodes, function(cardRequestNode) {

                // set mouse event handlers (bound to this context)
                cardRequestNode.addEventListener('mouseover', self._boundCardRequestMouseOverListener);
                cardRequestNode.addEventListener('mouseout', self._boundCardRequestMouseOutListener);
            });

        },

        _addNewCommentListener: function() {
            var self = this;

            self._newCommentObserver = new MutationObserver(function(mutations) {
                _.each(mutations, function(mutation) {
                    _.each(mutation.addedNodes, function(addedNode) {
                        // ignore text nodes and etc
                        if (addedNode.nodeType === Node.ELEMENT_NODE) {
                            // parse new nodes for comments containing card requests
                            var commentNodes = self.parser.parseNode(addedNode);
                            if (commentNodes.length > 0) {
                                self.model.addCommentNodes(commentNodes);
                            }
                        }
                    });
                });
            });

            // attach mutation listener to comments node to listen to
            // added nodes
            var commentsNode = document.querySelector('.commentarea');
            self._newCommentObserver.observe(commentsNode, {
                childList: true,
                subtree: true
            });

        },

        _showCardImageAtPosition: function(url, x, y) {
            var self = this;

            // remove popup if it is still visible
            this._removeCardImage();

            var div = document.createElement('div');
            var img = document.createElement('img');

            // TODO: consider compiling all ID's / Classnames in separate file
            div.id = 'hsl-card-img';
            div.style.left = x + 'px';
            div.style.top = y + 'px';
            img.src = url;

            //TODO: scale with browser size?
            img.style.width = "70%";
            img.style.height = "70%";

            // attach event listeners
            div.addEventListener('mouseover', function() {
                // if user hovers over card, cancel removal timeout
                if (self._popupTimeout) {
                    clearTimeout(self._popupTimeout);
                    self._popupTimeout = null;
                }
            });
            div.addEventListener('mouseout', function() {
                // remove card on mouse exit
                self._popupTimeout = setTimeout(function () {
                    self._removeCardImage();
                }, CARD_POPUP_TIMEOUT_MS);
            });

            this._cardPopupDiv = div;

            div.appendChild(img);
            document.body.appendChild(div);

        },

        _removeCardImage: function() {
            if (this._cardPopupDiv) {
                clearTimeout(this._popupTimeout);
                this._popupTimeout = null;
                this._cardPopupDiv.parentNode.removeChild(this._cardPopupDiv);
                this._cardPopupDiv = null;
            }
        },

        _invalidateCardRequest: function(cardRequestSpan) {
            // remove event listeners from invalid
            // card request wrapper & mark it as invalid
            if (cardRequestSpan) {
                cardRequestSpan.classList.remove('hsl-card-request');
                cardRequestSpan.classList.add('hsl-card-request-invalid');
                cardRequestSpan.title = 'Could not find this card';
                cardRequestSpan.removeEventListener('mouseover', this._boundCardRequestMouseOverListener);
                cardRequestSpan.removeEventListener('mouseout', this._boundCardRequestMouseOutListener);
            }
        },

        _cardRequestMouseOverListener: function(e) {
            var self = this;
            var cardRequestNode = e.target;
            var cardName = cardRequestNode.getAttribute('data-card');
            var eventCoords = [e.pageX, e.pageY];

            // TODO: how to get card img height??
            // TODO: adjust for right side cutoff??
            var popupVerticalCutOff = e.clientY + 330 - document.documentElement.clientHeight;
            if (popupVerticalCutOff > 0) {
                eventCoords = [e.pageX, e.pageY - popupVerticalCutOff];
            }

            // immediately remove existing card popup
            self._removeCardImage();

            var cardData = HSLCache.getCard(cardName);

            if (cardData === HSLCache.INVALID_CARD) {
                // card is invalid e.g. name was written incorrectly

                console.log('cached invalid card');
                self._invalidateCardRequest(cardRequestNode);

            } else if (cardData) {
                // if cached card data is valid, just use that

                console.log('from cache');
                //console.log(cardData);
                self._showCardImageAtPosition(cardData.img, eventCoords[0], eventCoords[1]);

            } else {
                // otherwise, request card data
                // TODO: exact name may be a bit stiff... although it is case insensitive... disregard spaces??
                self.service.querySingleCard(cardName)
                    .then(function(data) {
                        var cardList = JSON.parse(data);
                        if (cardList && cardList.length > 0) {

                            // we take the first card as the best match
                            cardData = cardList[0];

                            // replace card img url with https equivalent to avoid Mixed Content warnings
                            // TODO: really need this?
                            cardData.img = cardData.img.replace(HTTP_PREFIX_REGEX, 'https://');

                            // cache card data
                            HSLCache.addCard(cardName, cardData);

                            //console.log(data);

                            // display card popup
                            self._showCardImageAtPosition(cardData.img, eventCoords[0], eventCoords[1]);

                        } else {

                        }
                    })
                    .fail(function(error){
                        console.log(error);
                        // probably an invalid card name, cache null so we don't
                        // send another pointless request
                        HSLCache.addCard(cardName, HSLCache.INVALID_CARD);

                        self._invalidateCardRequest(cardRequestNode);
                    });
            }

        },

        _cardRequestMouseOutListener: function(e) {
            var self = this;
            // remove the floating card image after a short delay (if present)
            if (self._cardPopupDiv) {
                self._popupTimeout = setTimeout(function () {
                    self._removeCardImage();
                }, CARD_POPUP_TIMEOUT_MS);
            }
        }

    });


    return {
        CommentsView : CommentsView
    };

})(
    HSLCache
);
