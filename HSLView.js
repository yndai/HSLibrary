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



    var AutoCompleteWidget = function() {

    };
    _.extend(AutoCompleteWidget.prototype, {

    });

    var ImagePopupWidget = function() {

    };
    _.extend(ImagePopupWidget.prototype, {

    });

    var CommentsView = function(model, parser, service) {
        BaseListenerView.apply(this, arguments);

        this.model = model;
        this.parser = parser;
        this.service = service;

        // TODO: refactor card popup and autocomplete into isolated Widgets!

        /* ----- Card Popup state data ----- */
        // the card image popup
        this._cardPopupDiv = null;
        // timeout for removing the card popup
        this._popupTimeout = null;
        // card loading gif
        this._cardLoadGif = null;

        /* ----- Auto-Complete state data ----- */
        // auto-complete list container
        this._autoCompleteDiv = null;
        // current list of auto completions
        this._autoCompleteListWords = [];
        // current list of auto complete list elements
        this._autoCompleteListItems = [];
        // current index of selected auto completion item
        this._autoCompleteListSelectedIndex = -1;
        // trie containing card names
        this._cardNameTrie = null;

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
            this._addCommentTextAreaListeners();

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

            // attach event listeners to card request nodes
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

            if (self._autoCompleteDiv === null) {
                listDiv = document.createElement('div');
                list = document.createElement('ul');

                listDiv.id = 'hsl-auto-complete-container';
                list.className = 'hsl-auto-complete';

                listDiv.appendChild(list);
                document.body.appendChild(listDiv);

                document.body.addEventListener('keydown', function(e) {
                    var listItems = self._autoCompleteListItems;
                    if (show && listItems.length > 0) {
                        var selectedInd = self._autoCompleteListSelectedIndex;
                        switch (e.keyCode) {
                            case 38: // up
                                listItems[selectedInd].classList.remove('selected');
                                selectedInd = Math.max(0, selectedInd - 1);
                                //utils.scrollElementIntoView(listDiv, listItems[selectedInd]);
                                listItems[selectedInd].classList.add('selected');
                                self._autoCompleteListSelectedIndex = selectedInd;
                                e.stopPropagation();
                                e.preventDefault();
                                break;
                            case 40: // down
                                listItems[selectedInd].classList.remove('selected');
                                selectedInd = Math.min(selectedInd + 1, listItems.length - 1);
                                //utils.scrollElementIntoView(listDiv, listItems[selectedInd]);
                                listItems[selectedInd].classList.add('selected');
                                self._autoCompleteListSelectedIndex = selectedInd;
                                e.stopPropagation();
                                e.preventDefault();
                                break;
                            case 13: // enter
                                autoCompHandler(self._autoCompleteListWords[selectedInd]);
                                listDiv.style.display = 'none';
                                e.stopPropagation();
                                e.preventDefault();
                                break;
                        }
                    }
                }, true);

                self._autoCompleteDiv = listDiv;

            } else {
                listDiv = self._autoCompleteDiv;
                list = listDiv.querySelector('.hsl-auto-complete');
            }

            if (show) {

                listDiv.style.display = 'initial';
                listDiv.style.left = x + 'px';
                listDiv.style.top = y + 'px';
                list.innerHTML = '';

                // clear previous items
                self._autoCompleteListItems = [];
                self._autoCompleteListSelectedIndex = 0;
                self._autoCompleteListWords = words;

                // insert each word list item
                _.each(words, function (word) {
                    var wordItem = document.createElement('li');
                    wordItem.innerText = word;

                    wordItem.addEventListener('click', function (e) {
                        autoCompHandler(word);
                    });

                    list.appendChild(wordItem);
                    self._autoCompleteListItems.push(wordItem);
                });

                // mark first as selected initially
                if (self._autoCompleteListItems.length > 0) {
                    self._autoCompleteListItems[0].classList.add('selected');
                }

            } else {
                listDiv.style.display = 'none';
            }

        },

        _addCommentTextAreaListeners: function() {
            var self = this;

            var commentInput = document.querySelector('.usertext-edit textarea');
            if (commentInput === null) {
                return;
            }

            // create trie containing card names
            self._cardNameTrie = new utils.Trie();

            // TODO: using test data for now ( a snapshot of all card names )
            self._cardNameTrie.init(HSLTestCardNamesFull);

            // get position of text area
            var commentInputPos = utils.findAbsoluteOffset(commentInput);

            // listen to user typing comment & show auto-complete when
            // brackets are typed to start a card request
            commentInput.addEventListener('keydown', function (e) {

                // don't care about keys that do not affect text
                if (!utils.isKeyPrintable(e.keyCode)) {
                    return;
                }

                // get text up to text cursor
                var commentStr = commentInput.value.substr(0, commentInput.selectionStart);

                // if text is a character, append it to string up to cursor to get full string up to now
                //if (utils.isKeyCharacter(e.keyCode)) {
                //TODO: what does backspace convert to???
                    commentStr += String.fromCharCode(e.keyCode);
                //}

                // impossible to have double brackets with less than 2 chars
                if (commentStr.length < 2) {
                    return;
                }

                // if key is backspace, need to remove chars?? what about multi-char selection???
                if (e.keyCode === 8) {
                    commentStr = commentStr.substr(0, commentStr.length - 2);
                }

                var startBrackets = commentStr.lastIndexOf('[[');
                var endBrackets = commentStr.lastIndexOf(']]');

                if (endBrackets >= startBrackets) {
                    // this means that the start brackets were closed or
                    // they are both non-existent (== -1)
                    // so nothing to do
                    return;
                }

                // note: must add 2 to index since we need the string after the brackets
                var cardRequest = commentStr.substr(startBrackets + 2);
//console.log(cardRequest);
                if (cardRequest.length > 0) {

                    var cardNames = self._cardNameTrie.findCompletions(cardRequest);
                    //console.log(cardNames);

                    self._toggleAutoCompleteListAtPosition(
                        true,
                        cardNames,
                        commentInputPos[0] + commentInput.offsetWidth,
                        commentInputPos[1],
                        function(text) {
                            // need to update values as they may have changed
                            var commentStr2 = commentInput.value.substr(0, commentInput.selectionStart);
                            var startBrackets2 = commentStr2.lastIndexOf('[[');
                            commentInput.value = commentStr2.substr(0, startBrackets2 + 2) + text + ']]';
                        });
                }

            }, true); // note: we use capture so that we can intercept key press from parent (body) see _toggleAutoCompleteListAtPosition

            // remove auto-complete list when losing focus of text area
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
