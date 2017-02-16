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
        if(!/^\//.test(this.pathname)) {
          this.pathname = `/${ this.pathname }`;
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
        const MyEventRouter = Backbone.EventRouter.extend({
          channelName: function() {
            return 'foo';
          }
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

  describe('when defining a routeTriggers', function() {
    beforeEach(function() {
      this.routeTriggers = {
        'bar:event': ['some/url/:param', 'some/url', 'other/:section/:id'],
        'thing:list': 'other/:param'
      };

      this.addRouteTriggerStub = this.sinon.stub();

      this.EventRouter = Backbone.EventRouter.extend({
        _addRouteTrigger: this.addRouteTriggerStub
      });
    });

    describe('when defining routeTriggers as a hash', function() {
      beforeEach(function() {
        this.MyEventRouter = this.EventRouter.extend({
          routeTriggers: this.routeTriggers
        });
        this.myEventRouter = new this.MyEventRouter();
      });

      it('should add each route in the hash', function() {
        expect(this.addRouteTriggerStub).to.have.been.calledTwice;
      });

      it('should add each route(s) by the correct trigger', function() {
        expect(this.addRouteTriggerStub)
          .to.have.been.calledWith(this.routeTriggers['bar:event'], 'bar:event');
        expect(this.addRouteTriggerStub)
          .to.have.been.calledWith(this.routeTriggers['thing:list'], 'thing:list');
      });
    });

    describe('when defining routeTriggers as a function', function() {
      beforeEach(function() {
        this.MyEventRouter = this.EventRouter.extend({
          routeTriggers: _.constant(this.routeTriggers)
        });
        this.myEventRouter = new this.MyEventRouter();
      });

      it('should add each route in the hash', function() {
        expect(this.addRouteTriggerStub).to.have.been.calledTwice;
      });

      it('should add each route(s) by the correct trigger', function() {
        expect(this.addRouteTriggerStub)
          .to.have.been.calledWith(this.routeTriggers['bar:event'], 'bar:event');
        expect(this.addRouteTriggerStub)
          .to.have.been.calledWith(this.routeTriggers['thing:list'], 'thing:list');
      });
    });

    describe('when defining routeTriggers as instantiation option', function() {
      beforeEach(function() {
        this.MyEventRouter = this.EventRouter.extend();
        this.myEventRouter = new this.MyEventRouter({
          routeTriggers: this.routeTriggers
        });
      });

      it('should add each route in the hash', function() {
        expect(this.addRouteTriggerStub).to.have.been.calledTwice;
      });

      it('should add each route(s) by the correct trigger', function() {
        expect(this.addRouteTriggerStub)
          .to.have.been.calledWith(this.routeTriggers['bar:event'], 'bar:event');
        expect(this.addRouteTriggerStub)
          .to.have.been.calledWith(this.routeTriggers['thing:list'], 'thing:list');
      });
    });
  });

  describe('when calling overridden backbone.router#route', function() {
    beforeEach(function() {
      this.eventHandlerStub = this.sinon.stub();
      this.callbackStub = this.sinon.stub();

      this.MyEventRouter = Backbone.EventRouter.extend({
        eventHandler: this.eventHandlerStub
      });

      this.myEventRouter = new this.MyEventRouter();

      Backbone.history.start();
    });

    describe('when not passing a name', function() {
      beforeEach(function() {
        this.myEventRouter.route('some/url/:param', this.callbackStub);
        this.myEventRouter.navigate('some/url/foo', { trigger: true });
      });

      it('should create the route with name as an empty string', function() {
        expect(this.callbackStub).to.have.been.calledWith('foo');
      });
    });

    describe('when not passing a callback', function() {
      beforeEach(function() {
        this.myEventRouter.route('some/url/:param', 'eventHandler');
        this.myEventRouter.navigate('some/url/foo', { trigger: true });
      });

      it('should create the route with the callback as this[name]', function() {
        expect(this.eventHandlerStub).to.have.been.calledWith('foo');
      });
    });
  });
});
