describe("LRU Cache Tests", function() {

    var cache;
    var map;

    beforeEach(function () {
        cache = new HSLUtils.LRUCache(5);
        map = cache._itemMap;
    });

    // test initially empty and should not get anything
    it("should return empty list", function(){
        expect(cache.getSize()).toEqual(0);
        expect(cache.getItem("a")).toEqual(null);
    });

    // test put/get 1 item
    it("should be able to put and get an item", function(){
        cache.putItem("a", 1);

        expect(cache.getSize()).toEqual(1);
        expect(cache.getItem("a")).toEqual(1);

        expect(cache._front.key).toEqual("a");
    });

    // test collision update
    it("should update value on key collision", function(){
        cache.putItem("a", 1);
        cache.putItem("b", 1);
        cache.putItem("a", 2);

        expect(cache.getSize()).toEqual(2);
        expect(cache.getItem("a")).toEqual(2);
        expect(cache.getItem("b")).toEqual(1);

        expect(cache._front.key).toEqual("b");
    });

    // test cache purging old items
    it("number of entries should not exceed maxSize number", function(){
        cache.putItem("a", 1);
        cache.putItem("b", 1);
        cache.putItem("c", 1);
        cache.putItem("d", 1);
        cache.putItem("e", 1);
        cache.putItem("f", 1);

        expect(cache.getSize()).toEqual(5);
        expect(cache.getItem("a")).toEqual(null);
        expect(cache.getItem("b")).toEqual(1);
        expect(cache.getItem("c")).toEqual(1);
        expect(cache.getItem("d")).toEqual(1);
        expect(cache.getItem("e")).toEqual(1);
        expect(cache.getItem("f")).toEqual(1);

        expect(cache._front.key).toEqual("f");

        cache.putItem("g", 1);
        expect(cache.getSize()).toEqual(5);
        expect(cache.getItem("b")).toEqual(null);
        expect(cache.getItem("c")).toEqual(1);
        expect(cache.getItem("d")).toEqual(1);
        expect(cache.getItem("e")).toEqual(1);
        expect(cache.getItem("f")).toEqual(1);
        expect(cache.getItem("g")).toEqual(1);

        expect(cache._front.key).toEqual("g");
    });

    // test cache moving recently used items to front
    it("recent items should be moved to front", function() {
        cache.putItem("a", 1);
        cache.putItem("b", 1);
        cache.putItem("c", 1);
        cache.putItem("d", 1);
        cache.putItem("e", 1);
        cache.putItem("f", 1);

        expect(cache.getSize()).toEqual(5);
        expect(cache.getItem("a")).toEqual(null);
        expect(cache._front.key).toEqual("f");

        cache.getItem("b");
        expect(cache._front.key).toEqual("b");

        cache.getItem("f");
        expect(cache._front.key).toEqual("f");

        cache.putItem("h", 1);
        expect(cache._front.key).toEqual("h");
        expect(cache.getItem("c")).toEqual(null);
        expect(cache._front.key).toEqual("h");

        cache.getItem("e");
        expect(cache._front.key).toEqual("e");
    });

});
