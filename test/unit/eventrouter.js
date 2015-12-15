describe('Backbone.Eventrouter', function() {
  beforeEach(function() {
    this.Location = function(href) {
      this.replace(href);
    };

    _.extend(this.Location.prototype, {
      parser: document.createElement('a'),
      replace: function(href) {
        this.parser.href = href;
        _.extend(this, _.pick(this.parser,
          'href',
          'hash',
          'host',
          'search',
          'fragment',
          'pathname',
          'protocol'
        ));
        // In IE, anchor.pathname does not contain a leading slash though
        // window.location.pathname does.
        if (!/^\//.test(this.pathname)){
          this.pathname = '/' + this.pathname;
        }
      },
      toString: function() {
        return this.href;
      }
    });
  });

  afterEach(function() {
    Backbone.history.stop();
  });

  describe('when defining a channel name', function() {

    describe('on the definition', function() {

      it('should set the channel', function() {
        var MyEventRouter = Backbone.EventRouter.extend({
          channelName: function(){ return 'foo'; }
        });

        this.myEventRouter = new MyEventRouter();

        expect(this.myEventRouter.getChannel().channelName).to.eql('foo');
      });

    });

    describe('as an option during construction', function() {

      it('should set the channel', function() {
        this.myEventRouter = new Backbone.EventRouter({
          channelName: 'foo'
        });

        expect(this.myEventRouter.getChannel().channelName).to.eql('foo');
      });

    });

  });

  describe('when navigating from event', function(){
    beforeEach(function() {
      this.myEventRouter = new Backbone.EventRouter({
        routeTriggers: {
          'bar:event': ['some/url/:param', 'some/url', 'other/:section/:id'],
          'thing:list': 'other/:param'
        }
      });

      Backbone.history.location = new this.Location('http://example.com/example');
      Backbone.history.start();
    });

    it('should translate event to URL', function(){
      this.myEventRouter.navigateFromEvent('bar:event', 'foo');

      expect(Backbone.history.location.hash).to.equal('#some/url/foo');
    });
  });
});
