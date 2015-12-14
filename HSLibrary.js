'use strict';

(function HSLibraryInit(model) {

    document.body.style.backgroundColor = "yellow";

    var parser = new HSLParser.CommentParser();

    parser.parse();

    document.HSL_parser = parser;

    var service = new HSLServices.HSService();

    //TODO: need to organize data from AllCards: cards are organized by card set!!

    service.querySingleCard('Loatheb')
        .then(function(data) {
            console.log(JSON.stringify(data));
        })
        .fail(function(error) {
            alert('Failed to retrieve data');
            console.log(error);
        });

    var cardRequests = document.querySelectorAll('.hsl-card-request');

    _.each(cardRequests, function(cardRequest) {

        cardRequest.addEventListener('mouseover', function(e) {
            service.querySingleCard(cardRequest.getAttribute('data-card'))
                .then(function(data) {
                    console.log(JSON.stringify(data));
                })
                .fail(function(error){

                });
        });
    });

})(HSLModel);