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

  describe('when adding route trigger', function() {
    beforeEach(function() {
      Backbone.history.location = new this.Location('http://example.com/example');
      this.myEventRouter = new Backbone.EventRouter();

      this.fooStub = this.sinon.stub();
      Backbone.history.start();
    });

    describe('when defining a route trigger', function() {
      beforeEach(function() {
        var routerChannel = this.myEventRouter.getChannel();
        routerChannel.on('testevent:bar', this.fooStub);
        this.myEventRouter.addRouteTrigger('test/url/:foo', 'testevent:bar');
        this.myEventRouter.navigate('test/url/baz', { trigger: true });
      });

      it('should trigger the appropriate event', function(){
        expect(this.fooStub).to.have.been.calledOnce;
      });

      it('should pass the correct arguments', function(){
        expect(this.fooStub).to.have.been.calledWith('baz');
      });
    });

    describe('when defining a route trigger with an array of routes', function() {
      beforeEach(function() {
        var routerChannel = this.myEventRouter.getChannel();
        routerChannel.on('testevent:bar', this.fooStub);
        this.myEventRouter.addRouteTrigger(['test/url/:foo', 'thing/that/isdifferent'], 'testevent:bar');
        this.myEventRouter.navigate('test/url/baz', { trigger: true });
        this.myEventRouter.navigate('thing/that/isdifferent', { trigger: true });
      });

      it('should trigger the appropriate event in the array', function(){
        expect(this.fooStub).to.have.been.calledTwice;
      });

      it('should pass the correct arguments', function(){
        expect(this.fooStub).to.have.been.calledWith('baz');
        expect(this.fooStub).to.have.been.calledWith();
      });
    });
  });

  describe('when getting default route', function() {
    beforeEach(function() {
      this.myEventRouter = new Backbone.EventRouter();
    });

    it('should have a default route as first route in an array of routes', function(){
      this.myEventRouter.addRouteTrigger(['some/url/:original', 'some/url', 'another/thing/:id'], 'some:event');

      expect(this.myEventRouter.getDefaultRoute('some:event')).to.eql('some/url/:original');
    });

    it('should be called with passed-in event', function(){
      this.myEventRouter.addRouteTrigger('other/:param', 'other:thing');

      expect(this.myEventRouter.getDefaultRoute('other:thing')).to.eql('other/:param');
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

  describe('when translating route', function() {
    beforeEach(function() {
      this.myEventRouter = new Backbone.EventRouter();
    });

    it('should return a url with the named params replaced with the argument values', function(){
      var translatedRoute = this.myEventRouter.translateRoute('some/url/:param/:id', ['foo', 22]);
      expect(translatedRoute).to.eql('some/url/foo/22');
    });
  });
});
