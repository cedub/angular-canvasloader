(function(){
  angular.module('angular-canvasloader', [])

    .provider('$canvasLoader', [function () {

      var globalDefaults = {
        'radius':20,
        'color':'rgb(0,0,0)',
        'dotRadius':2.5,
        'backgroundColor':'transparent',
        'fps':10
      };

      this.setDefaults = function (defaults) {
        globalDefaults = _.extend(globalDefaults, defaults);
      };

      this.getDefaults = function () {
        return globalDefaults;
      };

      this.$get = ['$document', '$compile', '$rootScope', function($document, $compile, $rootScope) {
        this.options = {};
        return {
          options: _.extend(globalDefaults, this.options),
          launch: function (options) {
            var newScope = $rootScope.$new(true);
            this.instance = {
              scope: newScope,
              el: $compile('<canvas-loader-backdrop></canvas-loader-backdrop><canvas-loader width="300" height="300" style="position: absolute; top: 100px; margin-left: 50%; left: -150px; z-index: 100;"></canvas-loader>')(newScope)
            };
            var body = $document.find('body').eq(0);
            body.append(this.instance.el);
          },
          destroy: function () {
            this.instance.el.remove();
            this.instance.scope.$destroy();
            this.instance.el = undefined;
            this.instance.scope = undefined;
          }
        };
      }];
    }])


    .directive('canvasLoaderBackdrop', [function () {
      return {
        restrict: 'E',
        template: '<div style="width: 100%; height: 100%; position: fixed; background-color: #000; opacity: .5;"></div>'
      };
    }])


    .directive('canvasLoader', ['$interval', '$canvasLoader', function ($interval, $canvasLoader) {
      return {
        template: '<canvas></canvas>',
        restrict: 'E',
        scope: {
          options: '=?'
        },
        compile: function compile(tElement, tAttrs, transclude) {
          return function preLink(scope, iElement, iAttrs, controller) {

            if (angular.isDefined(iAttrs.width)) {
              iElement.children()[0].width = iAttrs.width;
            }

            if (angular.isDefined(iAttrs.height)) {
              iElement.children()[0].height = iAttrs.height;
            }

            // holds my canvas loader object
            scope.loaders = [];

            // the main drawing function      
            scope.draw = function () {
              for (i in scope.loaders) {
                scope.loaders[i].draw();
              }
            };

            // start drawing right away
            $interval(scope.draw, 1000/$canvasLoader.options.fps)

            var CanvasLoader = function(ctx, radius, color, dotRadius) {
              this.ctx = ctx;
              this.radius = radius;
              this.x = this.radius/2;
              this.y = this.radius/2;
              this.color = color;
              this.dotRadius = dotRadius;
              this.opacity = 1;
              this.numDots = 8;
              this.dots = {};
              this.degrees = Math.PI*2/this.numDots;
              for (i=1;i<=this.numDots;i++) {
                this.dots[i] = new scope.Dot(Math.cos(this.degrees * i) * this.radius/Math.PI, Math.sin(this.degrees * i) * this.radius/Math.PI, this.dotRadius, this.color, i/this.numDots);
                this.dots[i].parent = this;
              }
            }
          
            CanvasLoader.prototype.draw = function() {
              // clear old stuff
              this.ctx.clearRect(0,0,this.radius,this.radius);
              
              // draw the background color
              this.ctx.globalAlpha = 1;
              this.ctx.fillStyle = $canvasLoader.options.backgroundColor;
              this.ctx.fillRect(0,0,this.radius,this.radius);
              
              // fill in the dots
              for (i in this.dots) {
                this.dots[i].changeOpacity();
                this.dots[i].draw();
              }
            }   
            
            scope.Dot = function(x, y, radius, color, opacity) {
              this.radius = radius;
              this.color = color;
              this.opacity = opacity;
              this.x = x;
              this.y = y;
            }
            
            scope.Dot.prototype.draw = function() {
              this.parent.ctx.beginPath();
              this.parent.ctx.globalAlpha = this.opacity;
                this.parent.ctx.fillStyle = this.color;
              this.parent.ctx.arc(this.x+(this.parent.radius/2), this.y+(this.parent.radius/2), this.radius, 0, Math.PI*2, true);
              this.parent.ctx.fill();
            }
            
            scope.Dot.prototype.changeOpacity = function() {
              this.opacity -= 1/this.parent.numDots;
              if (this.opacity < 0) this.opacity = 1;
            }
            
            // set some local defaults that change
            var localDefaults = {
              'radius':(parseInt(tAttrs.width, 10)+parseInt(tAttrs.height, 10))/2,
              'dotRadius':(parseInt(tAttrs.width, 10)+parseInt(tAttrs.height, 10))/16
            };

            // extend the global defaults with the local defaults and then the user-supplied defaults.
            scope.options = _.extend(localDefaults, scope.options);
            scope.options = _.extend($canvasLoader.options, scope.options);

            // create a canvas object and get the context
            var canvas = iElement.children()[0];
            var ctx = canvas.getContext("2d");

            // simple feature detection, needs work
            if (!!ctx) {
              scope.loaders.push(new CanvasLoader(ctx, scope.options.radius, scope.options.color, scope.options.dotRadius));
            }
          }
        }
      };
    }]);

})();
