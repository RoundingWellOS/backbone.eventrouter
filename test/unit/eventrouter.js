describe('Backbone.Eventrouter', function() {

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

});
