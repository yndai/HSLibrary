'use strict';

var HSLUtils = (function() {

    /**
     * Wraps XHR obj prototype to enable listening to XHR's
     */
    var XHREventsWrapper = (function() {

        var listeners = [];

        // adapted from http://stackoverflow.com/questions/4406606/can-jquery-listen-to-ajax-calls-from-other-javascript

        // TODO: looks like reddit uses $.ajax and we dont have access to the $... MAYBE JUST LISTEN TO THE "more comments" links??

        var oldOpen = window.XMLHttpRequest.prototype.open,
            oldSend = window.XMLHttpRequest.prototype.send;

        var openReplacement = function(method, url, async, user, password) {
            var syncMode = async !== false ? 'async' : 'sync';
            console.warn(
                'Preparing ' +
                syncMode +
                ' HTTP request : ' +
                method +
                ' ' +
                url
            );
            return oldOpen.apply(this, arguments);
        };

        var sendReplacement = function(data) {
            console.warn('Sending HTTP request data : ', data);

            // save prev. method
            if(this.onreadystatechange) {
                this._onreadystatechange = this.onreadystatechange;
            }
            this.onreadystatechange = onReadyStateChangeReplacement;

            return oldSend.apply(this, arguments);
        };

        var onReadyStateChangeReplacement = function() {
            console.warn('HTTP request ready state changed : ' + this.readyState);
            if(this._onreadystatechange) {
                return this._onreadystatechange.apply(this, arguments);
            }
        };

        window.XMLHttpRequest.prototype.open = openReplacement;
        window.XMLHttpRequest.prototype.send = sendReplacement;

        // ---------- //

        function addListener(listener) {
            if (!_.contains(listeners, listener)) {
                listeners.push(listener);
            }
        }

        function removeListener(listener) {
            listeners = _.without(listeners, listener);
        }

        return {
            addListener: addListener,
            removeListener: removeListener
        };

    })();


    return {
        XHREventsWrapper: XHREventsWrapper
    };

})();
