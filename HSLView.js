'use strict';

var HSLViews = (function HSLView(
    cache,
    utils
) {

    var HTTP_PREFIX_REGEX = /^http:\/\//i;

    var CARD_POPUP_TIMEOUT_MS = 200;

    var LOAD_GIF_PATH = chrome.extension.getURL('style/load.gif');

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

        // card loading gif
        this._cardLoadGif = null;

        // auto-complete list
        this._autoCompleteDiv = null;

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

            // attach listener to comment input box for auto-complete pop-up to trigger
            // as user types a card request
            this._addCommentTextAreaListener();

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

        _toggleAutoCompleteListAtPosition: function(show, words, x, y, autoCompHandler) {

            var self = this;
            var listDiv;
            var list;

            if (this._autoCompleteDiv === null) {
                listDiv = document.createElement('div');
                list = document.createElement('ul');

                listDiv.id = 'hsl-auto-complete-container';
                list.className = 'hsl-auto-complete';

                listDiv.appendChild(list);
                document.body.appendChild(listDiv);

                this._autoCompleteDiv = listDiv;

            } else {
                listDiv = this._autoCompleteDiv;
                list = listDiv.querySelector('.hsl-auto-complete');
            }

            if (show) {

                listDiv.style.display = 'initial';
                listDiv.style.left = x + 'px';
                listDiv.style.top = y + 'px';
                list.innerHTML = '';

                // insert each word list item
                _.each(words, function (word) {
                    var wordItem = document.createElement('li');
                    wordItem.innerText = word;

                    wordItem.addEventListener('click', function (e) {
                        autoCompHandler(word);
                    });

                    list.appendChild(wordItem);
                });
            } else {
                listDiv.style.display = 'none';
            }

        },

        _addCommentTextAreaListener: function() {
            var self = this;

            var commentInput = document.querySelector('.usertext-edit textarea');
            if (commentInput === null) {
                return;
            }

            // for tracking user comment state
            var bracketPos = 0;
            var textState = 0;

            // trie containing card names
            var trie = new utils.Trie();
            // TODO: using test data for now ( a snapshot of all card names )
            trie.init(HSLTestCardNamesFull);

            var commentInputPos = utils.findAbsoluteOffset(commentInput);

            commentInput.addEventListener('keyup', function (e) {
                var commentStr = commentInput.value.substr(0, commentInput.selectionStart);

                if (commentStr.length < 2) {
                    return;
                }

                var lastTwoChar = commentStr.substr(commentStr.length - 2);

                // TODO: need to be smarter, e.g. detect user has deleted the brackets, etc (listen to backspace??)
                // TODO: find string up to caret... this is strange in chrome...
                if (textState === 0 && lastTwoChar === '[[') {
                    textState = 1;
                    bracketPos = commentStr.length;
                } else if (textState === 1 && lastTwoChar === ']]') {
                    textState = 0;
                    bracketPos = -1;
                } else if (textState === 1) {
                    var cardRequest = commentStr.substr(bracketPos);
                    if (cardRequest.length > 0) {
                        var cardNames = trie.findCompletions(cardRequest);
                        //console.log(cardNames);
                        self._toggleAutoCompleteListAtPosition(
                            true,
                            cardNames,
                            commentInputPos[0] + commentInput.offsetWidth,
                            commentInputPos[1],
                            function(text) {
                                commentInput.value = commentStr.substr(0, bracketPos) + text + ']]';
                                textState = 0;
                            });
                    }
                }
                console.log(textState);
            });

            commentInput.addEventListener('blur', function(e) {
                setTimeout(function() {
                    self._toggleAutoCompleteListAtPosition(false);
                }, 200);
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

        _toggleLoadGifAtPosition: function(show, x,y) {

            var div;
            var img;

            if (this._cardLoadGif === null) {

                div = document.createElement('div');
                img = document.createElement('img');

                img.src = LOAD_GIF_PATH;
                div.id = 'hsl-card-load';
                div.style.display = 'initial';

                div.appendChild(img);
                document.body.appendChild(div);

                this._cardLoadGif = div;

            } else {
                div = this._cardLoadGif;
            }

            if (show) {
                div.style.left = x + 'px';
                div.style.top = y + 'px';
                div.style.display = 'initial';
            } else {
                div.style.display = 'none';
            }

        },

        _showCardImageAtPosition: function(url, x, y) {
            var self = this;
            var div;
            var img;

            // create popup
            if (this._cardPopupDiv === null) {
                self._removeCardImage();

                div = document.createElement('div');
                img = document.createElement('img');

                // TODO: consider compiling all ID's / Classnames in separate file
                div.id = 'hsl-card-img-container';
                img.className = 'hsl-card-img';

                //TODO: scale img with viewport size?

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

            } else {

                div = this._cardPopupDiv;
                img = div.querySelector('.hsl-card-img');

            }

            div.style.left = x + 'px';
            div.style.top = y + 'px';
            img.src = url;
            div.style.display = 'initial';

        },

        _removeCardImage: function() {
            if (this._cardPopupDiv) {
                clearTimeout(this._popupTimeout);
                this._popupTimeout = null;
                this._cardPopupDiv.style.display = 'none';
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

            var cardData = cache.getCard(cardName);

            if (cardData === cache.INVALID_CARD) {
                // card is invalid e.g. name was written incorrectly

                console.log('cached invalid card');
                self._invalidateCardRequest(cardRequestNode);

            } else if (cardData) {
                // if cached card data is valid, just use that

                console.log('from cache');
                //console.log(cardData);
                self._showCardImageAtPosition(cardData.img, eventCoords[0], eventCoords[1]);

            } else {

                // show loading gif
                self._toggleLoadGifAtPosition(true, e.pageX, e.pageY);

                // request card data
                self.service.querySingleCard(cardName)
                    .then(function(data) {
                        var cardList = JSON.parse(data);
                        if (cardList && cardList.length > 0) {

                            // we take the first card as the best match
                            cardData = cardList[0];

                            // replace card img url with https equivalent to avoid Mixed Content warnings
                            cardData.img = cardData.img.replace(HTTP_PREFIX_REGEX, 'https://');

                            // cache card data
                            cache.addCard(cardName, cardData);

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
                        cache.addCard(cardName, cache.INVALID_CARD);

                        self._invalidateCardRequest(cardRequestNode);
                    })
                    .finally(function() {
                        // remove loading gif
                        self._toggleLoadGifAtPosition(false);
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
    HSLCache,
    HSLUtils
);
