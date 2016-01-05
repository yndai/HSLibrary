'use strict';

var HSLServices = (function(HSAPI) {

    var HSService = function() {

        this.KEY = HSAPI.key;
        this.URL_PREFIX = HSAPI.urlPrefix;

    };
    _.extend(HSService.prototype, {

        /**
         * Search for a card by name (partial match)
         * @param name
         * @returns {promise}
         */
        querySingleCard: function(name) {

            return this._makeXHRGet(
                this.URL_PREFIX + 'cards/search/' + name,
                {'X-Mashape-Key': this.KEY},
                {'collectible': 1}
            );

        },

        /**
         * Query all collectible cards (large size & slow)
         * @returns {promise}
         */
        queryAllCards: function() {

            return this._makeXHRGet(
                this.URL_PREFIX + 'cards',
                {'X-Mashape-Key': this.KEY},
                {'collectible': 1, 'cost': 0}
            );
 
        },

        // TODO: if need other services, move this to a base class
        /**
         * Initiates a Get XHR and returns a promise
         * @param url
         * @param headers
         * @param data
         * @returns {promise}
         * @private
         */
        _makeXHRGet: function(url, headers, data) {

            var defer = Q.defer();
            var xhr = new XMLHttpRequest();
            var params = '';
            var firstData = true;

            // construct parameter string
            _.each(data, function(val, key) {
                if (firstData) {
                    params += '?';
                    firstData = false;
                } else {
                    params += '&';
                }
                params += key + '=' + val;
            });

            xhr.open('get', url + params);

            // set request headers
            _.each(headers, function(val, key) {
                xhr.setRequestHeader(key, val);
            });

            // set callback
            xhr.onreadystatechange = function(e) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        defer.resolve(xhr.response);
                    } else {
                        defer.reject(xhr.statusText);
                    }
                }
            };

            xhr.send(params);

            return defer.promise;
        }

    });


    return {
        HSService: HSService
    };

})(HSAPI);

