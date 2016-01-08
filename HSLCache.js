'use strict';

var HSLCache = (function(utils) {

    var INVALID_CARD = -1;

    // TODO: decide on a reasonable limit
    var cardDataCache = new utils.LRUCache(100);

    function addCard(name, cardData) {
        cardDataCache.putItem(name, cardData);
    }

    function getCard(name) {
        return cardDataCache.getItem(name);
    }


    return {

        INVALID_CARD: INVALID_CARD,
        addCard: addCard,
        getCard: getCard

    };

})(HSLUtils);