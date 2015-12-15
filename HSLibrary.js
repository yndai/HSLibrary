'use strict';

(function HSLibraryInit(
    cache,
    parser,
    services,
    model
) {

    document.body.style.backgroundColor = "yellow";

    var commentParser = new parser.CommentParser();

    commentParser.parse();

    var service = new services.HSService();

    //TODO: need to organize data from AllCards: cards are organized by card set!!

    //service.querySingleCard('Loatheb')
    //    .then(function(data) {
    //        console.log(JSON.stringify(data));
    //    })
    //    .fail(function(error) {
    //        alert('Failed to retrieve data');
    //        console.log(error);
    //    });

    var cardRequests = document.querySelectorAll('.hsl-card-request');

    _.each(cardRequests, function(cardRequest) {

        cardRequest.addEventListener('mouseover', function(e) {

            var cardName = cardRequest.getAttribute('data-card');

            var cardData = null;

            if (cardData = cache.getCard(cardName)) {

                console.log('from cache');
                console.log(JSON.stringify(cardData));

            } else {

                service.querySingleCard(cardName)
                    .then(function(data) {
                        if (data) {
                            HSLCache.addCard(cardName, JSON.parse(data));
                            console.log(data);
                        }
                    })
                    .fail(function(error){
                        console.log('card not found');
                    });

            }


        });
    });

})(
    HSLCache,
    HSLParser,
    HSLServices,
    HSLModel
);