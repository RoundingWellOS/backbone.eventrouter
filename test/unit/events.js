describe('Backbone.Eventrouter Events', function() {
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
    Backbone.history.location = new this.Location('http://example.com/example');
    this.myEventRouter = new Backbone.EventRouter();
    this.routerChannel = this.myEventRouter.getChannel();

    Backbone.history.start();
  });

  afterEach(function() {
    Backbone.history.stop();
  });

  describe('when a route is run', function() {
    describe('when that route is handled by the router', function() {
      beforeEach(function() {
        this.beforeRouteStub = this.sinon.stub();
        this.routeStub = this.sinon.stub();
        this.beforeRouteNameStub = this.sinon.stub();
        this.routeNameStub = this.sinon.stub();

        this.myEventRouter.on('before:route', this.beforeRouteStub);
        this.myEventRouter.on('route', this.routeStub);
        this.myEventRouter.on('before:route:testevent:bar', this.beforeRouteNameStub);
        this.myEventRouter.on('route:testevent:bar', this.routeNameStub);

        this.myEventRouter.addRouteTrigger('test/url/:foo', 'testevent:bar');
        this.myEventRouter.navigate('test/url/baz', { trigger: true });
      });

      it('should throw a before:route event to match the route event', function() {
        expect(this.beforeRouteStub).to.have.been.calledOnce;
        expect(this.beforeRouteStub.args).to.deep.equal(this.routeStub.args);
      });

      it('should throw a before:route:[name] event to match the route:[name] event', function() {
        expect(this.beforeRouteNameStub).to.have.been.calledOnce;
        expect(this.beforeRouteNameStub.args).to.deep.equal(this.routeNameStub.args);
      });
    });
    describe('when that route is not handled by the router', function() {
      beforeEach(function() {
        this.noMatchStub = this.sinon.stub();
        this.myEventRouter.on('noMatch', this.noMatchStub);

        this.myEventRouter.navigate('test/url/baz', { trigger: true });
      });

      it('should throw a noMatch event', function() {
        expect(this.noMatchStub).to.have.been.calledOnce;
      });

      it('should pass the event args to the noMatch event', function() {
        expect(this.noMatchStub).to.have.been.calledWith('testevent:bar', 'baz');
      });
    });
  });

  describe('when a event is triggered', function() {
    describe('when that event is handled by the router', function() {
      beforeEach(function() {
        this.beforeRouteStub = this.sinon.stub();
        this.routeStub = this.sinon.stub();
        this.beforeRouteNameStub = this.sinon.stub();
        this.routeNameStub = this.sinon.stub();

        this.myEventRouter.on('before:route', this.beforeRouteStub);
        this.myEventRouter.on('route', this.routeStub);
        this.myEventRouter.on('before:route:testevent:bar', this.beforeRouteNameStub);
        this.myEventRouter.on('route:testevent:bar', this.routeNameStub);

        this.myEventRouter.addRouteTrigger('test/url/:foo', 'testevent:bar');
        this.routerChannel.trigger('testevent:bar', 'baz');
      });

      it('should not throw a before:route event', function() {
        expect(this.beforeRouteStub).to.not.have.been.called;
      });

      it('should not throw a before:route:[name] event', function() {
        expect(this.beforeRouteNameStub).to.not.have.been.called;
      });
    });
    describe('when that route is not handled by the router', function() {
      beforeEach(function() {
        this.noMatchStub = this.sinon.stub();
        this.myEventRouter.on('noMatch', this.noMatchStub);

        this.routerChannel.trigger('testevent:bar', 'baz');
      });

      it('should throw a noMatch event', function() {
        expect(this.noMatchStub).to.have.been.calledOnce;
      });

      it('should pass the event args to the noMatch event', function() {
        expect(this.noMatchStub).to.have.been.calledWith('testevent:bar', 'baz');
      });
    });
  });
});
