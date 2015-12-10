'use strict';

var HSLServices = (function(HSAPI) {

    var HSLService = function() {

        this.key = HSAPI.key;

        this.urlPrefix = HSAPI.urlPrefix;
    };
    _.extend(HSLServices.prototype, {

        ///**
        // * Query list of buildings
        // * @returns {*|promise}
        // */
        //queryBuildings: function() {
        //    var self = this;
        //    var deferred = Q.defer();
        //
        //    $.get(self.urlPrefix + '/buildings/list.json', {key: self.key})
        //        .done(function(response) {
        //            deferred.resolve(response.data);
        //        })
        //        .fail(function(response) {
        //            deferred.reject(response.statusText);
        //        });
        //
        //    return deferred.promise;
        //},
        //
        ///**
        // * Query details of a single building
        // * @param buildingCode
        // * @returns {*|promise}
        // */
        //getBuilding: function(buildingCode) {
        //    var self = this;
        //    var deferred = Q.defer();
        //
        //    $.get(self.urlPrefix + '/buildings/' + buildingCode + '.json', {key: self.key})
        //        .done(function(response) {
        //            deferred.resolve(response.data);
        //        })
        //        .fail(function() {
        //            deferred.reject();
        //        });
        //
        //    return deferred.promise;
        //}

    });


    return {

        UWaterlooService: UWaterlooService

    };

})();

