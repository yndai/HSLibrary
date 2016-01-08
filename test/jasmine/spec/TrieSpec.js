describe("Trie Tests", function() {

  var trie;
  var completions;

  beforeEach(function() {
    trie = new HSLUtils.Trie();
  });

  // test initially empty and should not match anything
  it("should return empty list", function() {
    completions = trie.findCompletions("a");

    expect(completions.length).toEqual(0);
  });

  // test 1 insertion and completion
  it("should return andy as completion", function() {
    trie.addWordToTrie("andy");
    completions = trie.findCompletions("and");

    expect(completions.length).toEqual(1);
    expect(completions).toContain('andy');
  });

  // test non completion
  it("should not return sandy as completion", function() {
    trie.addWordToTrie("sand");
    trie.addWordToTrie("sandy");
    completions = trie.findCompletions("and");

    expect(completions.length).toEqual(0);
  });

  // test multiple matches & insertions
  it("should return and, andy, andromeda, android as completions", function() {
    trie.init(["andromeda", "andy", "and", "android", "ant", "an"]);
    completions = trie.findCompletions("and");

    expect(completions.length).toEqual(4);
    expect(completions).toContain("andromeda");
    expect(completions).toContain("and");
    expect(completions).toContain("andy");
    expect(completions).toContain("android");
  });

  // test matching entire word
  it("should return android as completion", function() {
    trie.init(["andromeda", "andy", "and", "android", "ant", "an"]);
    completions = trie.findCompletions("android");

    expect(completions.length).toEqual(1);
    expect(completions).toContain("android");
  });

  // test trying to complete empty string
  it("should return all words when partial is empty", function() {
    trie.init(["andy", "and", "attic", "zebra", "day", "daydream"]);
    completions = trie.findCompletions("");

    expect(completions.length).toEqual(6);
    expect(completions).toContain('andy');
    expect(completions).toContain('and');
    expect(completions).toContain('attic');
    expect(completions).toContain('zebra');
    expect(completions).toContain('day');
    expect(completions).toContain('daydream');
  });

  // test some symbols, spaces, punctuation, capitals, numbers
  it("should return correct completions which have symbols, numbers, capitals and spaces", function() {
    trie.init(["andromeda's [fury]", "andy's //()revenge", "AND.", "Ant,", "antenna?:;", "ankle", "911"]);

    completions = trie.findCompletions("andromeda");

    expect(completions.length).toEqual(1);
    expect(completions).toContain("andromeda's [fury]");

    completions = trie.findCompletions("and");

    expect(completions.length).toEqual(3);
    expect(completions).toContain("andromeda's [fury]");
    expect(completions).toContain("andy's //()revenge");
    expect(completions).toContain("and.");

    completions = trie.findCompletions("ant");

    expect(completions.length).toEqual(2);
    expect(completions).toContain("ant,");
    expect(completions).toContain("antenna?:;");

    completions = trie.findCompletions("9");

    expect(completions.length).toEqual(1);
    expect(completions).toContain("911");

    completions = trie.findCompletions("ankla");

    expect(completions.length).toEqual(0);
  });

});
