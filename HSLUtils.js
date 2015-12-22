'use strict';

var HSLUtils = (function() {

    /**
     * Wraps XHR obj prototype to enable listening to XHR's
     * TODO: wanted to listen to xhr's so we can parse newly added comments or parse hidden comments; this does not work since the content script's environment is isolated (except for the page DOM) and so we have no access to the xhr obj the main page uses...
     */
    //var XHREventsWrapper = (function() {
    //
    //    var listeners = [];
    //
    //    // adapted from http://stackoverflow.com/questions/4406606/can-jquery-listen-to-ajax-calls-from-other-javascript
    //
    //    var oldOpen = window.XMLHttpRequest.prototype.open,
    //        oldSend = window.XMLHttpRequest.prototype.send;
    //
    //    var openReplacement = function(method, url, async, user, password) {
    //        var syncMode = async !== false ? 'async' : 'sync';
    //        console.warn(
    //            'Preparing ' +
    //            syncMode +
    //            ' HTTP request : ' +
    //            method +
    //            ' ' +
    //            url
    //        );
    //        return oldOpen.apply(this, arguments);
    //    };
    //
    //    var sendReplacement = function(data) {
    //        console.warn('Sending HTTP request data : ', data);
    //
    //        // save prev. method
    //        if(this.onreadystatechange) {
    //            this._onreadystatechange = this.onreadystatechange;
    //        }
    //        this.onreadystatechange = onReadyStateChangeReplacement;
    //
    //        return oldSend.apply(this, arguments);
    //    };
    //
    //    var onReadyStateChangeReplacement = function() {
    //        console.warn('HTTP request ready state changed : ' + this.readyState);
    //        if(this._onreadystatechange) {
    //            return this._onreadystatechange.apply(this, arguments);
    //        }
    //    };
    //
    //    window.XMLHttpRequest.prototype.open = openReplacement;
    //    window.XMLHttpRequest.prototype.send = sendReplacement;
    //
    //    // ---------- //
    //
    //    function addListener(listener) {
    //        if (!_.contains(listeners, listener)) {
    //            listeners.push(listener);
    //        }
    //    }
    //
    //    function removeListener(listener) {
    //        listeners = _.without(listeners, listener);
    //    }
    //
    //    return {
    //        addListener: addListener,
    //        removeListener: removeListener
    //    };
    //
    //})();


    return {

    };

})();
