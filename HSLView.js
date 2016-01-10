'use strict';

var HSLViews = (function HSLView(
    cache,
    utils
) {

    var HTTP_PREFIX_REGEX = /^http:\/\//i;

    var POPUP_TIMEOUT_MS = 200;

    var LOAD_GIF_PATH = chrome.extension.getURL('style/load.gif');



    /**
     * Base class for views that listen to a listenable model
     * @param model
     * @constructor
     */
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



    /**
     * Auto-complete widget which can be attached to a text entry element
     * @constructor
     */
    var AutoCompleteWidget = function() {

        // auto-complete list container
        this._autoCompleteDiv = null;

        // current list of auto completions
        this._autoCompleteListWords = [];

        // current list of auto complete list elements
        this._autoCompleteListItems = [];

        // current index of selected auto completion item
        this._autoCompleteListSelectedIndex = -1;

        // trie containing card names
        this._wordsTrie = null;

    };
    _.extend(AutoCompleteWidget.prototype, {

        /**
         * Initialize auto complete at a text input element with given
         * auto completions
         * @param textInputElement
         * @param words
         */
        init: function(textInputElement, words) {

            // create trie containing card names
            this._wordsTrie = new utils.Trie();

            // TODO: using test data for now ( a snapshot of all card names )
            this._wordsTrie.init(words);

            this._addTextElementListeners(textInputElement);

        },

        /**
         * Toggle auto-complete selection list. If show is false,
         * other parameters are ignored. AutoCompHandler called when an option
         * is selected
         * @param show
         * @param words
         * @param x
         * @param y
         * @param autoCompHandler
         * @private
         */
        _toggleAutoCompleteListAtPosition: function(show, words, x, y, autoCompHandler) {
            var self = this;
            var listDiv;
            var list;

            if (self._autoCompleteDiv === null) {
                listDiv = document.createElement('div');
                list = document.createElement('ul');

                listDiv.className = 'hsl-auto-complete-container';
                list.className = 'hsl-auto-complete';

                listDiv.appendChild(list);
                document.body.appendChild(listDiv);

                // enable use of arrow keys to navigate completions
                document.body.addEventListener('keydown', function(e) {
                    var listItems = self._autoCompleteListItems;
                    if (listDiv.style.display !== 'none' && listItems.length > 0) {
                        var selectedInd = self._autoCompleteListSelectedIndex;

                        if (e.keyCode === 38 || e.keyCode === 40) { // up or down
                            listItems[selectedInd].classList.remove('selected');

                            selectedInd = (e.keyCode === 38) ?
                                Math.max(0, selectedInd - 1) : Math.min(selectedInd + 1, listItems.length - 1);

                            listItems[selectedInd].classList.add('selected');
                            self._autoCompleteListSelectedIndex = selectedInd;
                            e.stopPropagation();
                            e.preventDefault();

                        } else if (e.keyCode === 13) { // enter

                            autoCompHandler(self._autoCompleteListWords[selectedInd]);
                            listDiv.style.display = 'none';
                            e.stopPropagation();
                            e.preventDefault();

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

        /**
         * Add listener to text element
         * @param commentInput
         * @private
         */
        _addTextElementListeners: function(commentInput) {
            var self = this;

            if (commentInput === null) {
                return;
            }

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

                    var cardNames = self._wordsTrie.findCompletions(cardRequest);
                    //console.log(cardNames);

                    self._toggleAutoCompleteListAtPosition(
                        true,
                        cardNames,
                        commentInputPos[0] + commentInput.offsetWidth,
                        commentInputPos[1],
                        function(text) {
                            // need to update values as they may have changed
                            commentStr = commentInput.value.substr(0, commentInput.selectionStart);
                            startBrackets = commentStr.lastIndexOf('[[');
                            commentInput.value = commentStr.substr(0, startBrackets + 2) + text + ']]';
                        });
                }

            }, true); // note: we use capture so that we can intercept key press from parent (body) see _toggleAutoCompleteListAtPosition

            // remove auto-complete list when losing focus of text area
            commentInput.addEventListener('blur', function(e) {
                setTimeout(function() {
                    self._toggleAutoCompleteListAtPosition(false);
                }, POPUP_TIMEOUT_MS);
            });

        }

    });



    /**
     * A widget that can display an image popup at a specified location
     * @constructor
     */
    var ImagePopupWidget = function() {

        // popup container
        this._imagePopupDiv = null;

        // popup image
        this._popupImage = null;

        // timeout for removing popup
        this._popupTimeout = null;

        // image loading gif
        this._imageLoadGif = null;

    };
    _.extend(ImagePopupWidget.prototype, {

        /**
         * Toggle a loading spinner at a given position.
         * If show is false, other arguments are ignored.
         * @param {boolean} show
         * @param {number} x
         * @param {number} y
         */
        toggleLoadGifAtPosition: function(show, x, y) {

            var self = this;
            var div;
            var img;

            // init img if needed
            if (self._imageLoadGif === null) {

                div = document.createElement('div');
                img = document.createElement('img');

                img.src = LOAD_GIF_PATH;
                div.className = 'hsl-img-load';
                div.style.display = 'initial';

                div.appendChild(img);
                document.body.appendChild(div);

                self._imageLoadGif = div;

            } else {
                div = self._imageLoadGif;
            }

            if (show) {
                div.style.left = x + 'px';
                div.style.top = y + 'px';
                div.style.display = 'initial';
            } else {
                div.style.display = 'none';
            }

        },

        /**
         * Display an image popup at a given position from a given url.
         * @param {string} url
         * @param {number} x
         * @param {number} y
         */
        showPopupAtPosition: function(url, x, y) {
            var self = this;
            var div;
            var img;

            // init popup if needed
            if (self._imagePopupDiv === null) {

                div = document.createElement('div');
                img = document.createElement('img');

                div.className = 'hsl-popup-img-container';
                img.className = 'hsl-popup-img';

                //TODO: scale img with viewport size?

                // attach event listeners
                div.addEventListener('mouseover', function() {
                    // if user hovers over card, cancel removal timeout
                    self._clearPopupTimeout();
                });
                div.addEventListener('mouseout', function() {
                    // remove card on mouse exit
                    self.hidePopup();
                });

                self._imagePopupDiv = div;
                self._popupImage = img;

                div.appendChild(img);
                document.body.appendChild(div);

            } else {

                div = self._imagePopupDiv;
                img = self._popupImage;

            }

            // make sure there are no removal timeouts
            this._clearPopupTimeout();

            div.style.left = x + 'px';
            div.style.top = y + 'px';
            img.src = url;
            div.style.display = 'initial';

        },

        /**
         * Hide image popup after a short timeout
         */
        hidePopup: function() {
            var self = this;

            if (self._imagePopupDiv) {
                self._popupTimeout = setTimeout(function () {
                    self._clearPopupTimeout();
                    self._imagePopupDiv.style.display = 'none';
                }, POPUP_TIMEOUT_MS);
            }
        },

        /**
         * Clear popup removal timeout
         * @private
         */
        _clearPopupTimeout: function() {
            clearTimeout(this._popupTimeout);
            this._popupTimeout = null;
        }

    });



    /**
     * Manages various controls within the comment section. Extends BaseListenerView.
     * @param model
     * @param parser
     * @param service
     * @constructor
     */
    var CommentsView = function(model, parser, service) {
        BaseListenerView.apply(this, arguments);

        this.model = model;
        this.parser = parser;
        this.service = service;

        // for displaying card image popups
        this._cardPopupWidget = new ImagePopupWidget();

        // for displaying card name completions in comment text area
        this._cardAutocompleteWidget = new AutoCompleteWidget();

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

            // init card name auto complete for comment entry
            // TODO: using snapshot of card names list for now
            // TODO: add this functionality to reply textboxes too
            this._cardAutocompleteWidget.init(document.querySelector('.usertext-edit textarea'), HSLTestCardNamesFull);

        },

        /**
         * Called by model to update view on data changes
         * @param event
         * @param data
         */
        update: function(event, data) {
            console.log(event);

            // get a flat list of card request nodes that were inserted into the DOM by the parser
            var cardRequestNodes = [];
            _.each(data, function(commentNode) {
                // since the map values are arrays, need to merge/flatten into single array
                var mergedCardReqNodes = Array.prototype.concat.apply([], _.values(commentNode.cardReqNodeMap));
                Array.prototype.push.apply(cardRequestNodes, mergedCardReqNodes);
            });

            // attach event listeners to card request nodes
            this._addCardRequestListeners(cardRequestNodes);

        },

        /**
         * Add listeners to card request wrappers
         * @param cardRequestNodes
         * @private
         */
        _addCardRequestListeners: function(cardRequestNodes) {
            var self = this;

            _.each(cardRequestNodes, function(cardRequestNode) {
                // set mouse event handlers (bound to this context)
                cardRequestNode.addEventListener('mouseover', self._boundCardRequestMouseOverListener);
                cardRequestNode.addEventListener('mouseout', self._boundCardRequestMouseOutListener);
            });

        },

        /**
         * Add mutation observer to comment section to update model when
         * a new comment with card requests is appended
         * @private
         */
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

        /**
         * Mark card request as invalid e.g. misspelled, etc
         * @param cardRequestSpan
         * @private
         */
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

        /**
         * Mouse over listener for card request wrappers
         * @param e
         * @private
         */
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

            var cardData = cache.getCard(cardName);

            if (cardData === cache.INVALID_CARD) {
                // card is invalid e.g. name was written incorrectly

                console.log('cached invalid card');
                self._invalidateCardRequest(cardRequestNode);

            } else if (cardData) {
                // if cached card data is valid, just use that

                console.log('from cache');
                //console.log(cardData);
                self._cardPopupWidget.showPopupAtPosition(cardData.img, eventCoords[0], eventCoords[1]);

            } else {

                // show loading gif
                self._cardPopupWidget.toggleLoadGifAtPosition(true, e.pageX, e.pageY);

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
                            self._cardPopupWidget.showPopupAtPosition(cardData.img, eventCoords[0], eventCoords[1]);

                        } else {
                            // uh oh
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
                        self._cardPopupWidget.toggleLoadGifAtPosition(false);
                    });
            }

        },

        /**
         * Mouse out listener for card request wrappers
         * @param e
         * @private
         */
        _cardRequestMouseOutListener: function(e) {
            var self = this;
            // remove the floating card image after a short delay (if present)
            self._cardPopupWidget.hidePopup();
        }

    });



    return {
        CommentsView : CommentsView
    };

})(
    HSLCache,
    HSLUtils
);
