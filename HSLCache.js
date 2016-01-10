'use strict';

var HSLCache = (function(utils) {

    var INVALID_CARD = -1;

    // TODO: decide on a reasonable limit
    var cardDataCache = new utils.LRUCache(100);

    /**
     * Store a card & card data
     * @param name
     * @param cardData
     */
    function addCard(name, cardData) {
        cardDataCache.putItem(name, cardData);
    }

    /**
     * Get stored card data using card name
     * @param name
     * @returns
     */
    function getCard(name) {
        return cardDataCache.getItem(name);
    }


    return {

        INVALID_CARD: INVALID_CARD,
        addCard: addCard,
        getCard: getCard

    };

})(HSLUtils);