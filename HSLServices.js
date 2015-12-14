'use strict';

var HSLServices = (function(HSAPI) {

    var HSService = function() {

        this.KEY = HSAPI.key;
        this.URL_PREFIX = HSAPI.urlPrefix;

    };
    _.extend(HSService.prototype, {

        /**
         * Query all collectible cards
         * @returns promise
         */
        queryAllCards: function() {

            return this._makeXHRGet(
                this.URL_PREFIX + 'cards',
                {
                    'X-Mashape-Key': this.KEY
                },
                {
                    'collectible': 1,
                    'cost': 0
                }
            );
 
        },

        /**
         * Initiates a Get XHR and returns a promise
         * @param url
         * @param headers
         * @param data
         * @returns promise
         * @private
         */
        _makeXHRGet: function(url, headers, data) {

            var defer = Q.defer();
            var xhr = new XMLHttpRequest();
            var params = '';

            // construct parameter string
            var firstData = true;
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
                        defer.resolve(xhr.responseText);
                    } else {
                        defer.fail(xhr.statusText);
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

