(function () {
    'use strict';

    function SpriteSheet(img) {
        // array of sprites
        this.sprites = [];
        // number of sprites in image
        this.nbSprites = 0;
	// default width and height sprite
        this.width = 0;
        this.height = 0;
	// width and height of the original image
        this.imageWidth = 0;
        this.imageHeight = 0;
        // load image parameters
        this.load(img);
    }

    SpriteSheet.prototype = {
        load: function (img) {
	    // set sprite dimension
            this.height = img.getAttribute('height');
            this.width = img.getAttribute('width');

	    // load sprites if defined
            if (img.getAttribute('data-sprites') !== null) {
                var dataSprites = JSON.parse(img.getAttribute('data-sprites')),
                    i = 0,
                    len = 0;

		// sprites defined using an array
                if (Array.isArray(dataSprites)) {
                    for (i = 0, len = dataSprites.length; i < len; i += 1) {
                        if (dataSprites[i].length > 2) {
                            this.sprites[i] = {
                                x: dataSprites[i][0],
                                y: dataSprites[i][1],
                                width: dataSprites[i][2],
                                height: dataSprites[i][3]
                            };
                        } else {
                            this.sprites[i] = {
                                x: dataSprites[i][0],
                                y: dataSprites[i][1]
                            };
                        }
                    }
		// sprites defined using names
                } else {
                    for (i in dataSprites) {
                        if (dataSprites.hasOwnProperty(i)) {
                            if (dataSprites[i].length > 2) {
                                this.sprites[i] = {
                                    x: dataSprites[i][0],
                                    y: dataSprites[i][1],
                                    width: dataSprites[i][2],
                                    height: dataSprites[i][3]
                                };
                            } else {
                                this.sprites[i] = {
                                    x: dataSprites[i][0],
                                    y: dataSprites[i][1]
                                };
                            }
                        }
                    }
                }
            }
            // load number of sprites
            if (img.getAttribute('data-nb-sprites') !== null) {
                this.nbSprites = img.getAttribute('data-nb-sprites');
            }
        },

        getNbSprites: function () {
            return this.nbSprites;
        },

        setNbSprites: function () {
            if (this.nbSprites === 0 && this.width !== 0 && this.height !== 0) {
                this.nbSprites = parseInt(this.imageWidth / this.width, 10) * parseInt(this.imageHeight / this.height, 10);
            }
        },

        setSprites: function () {
            var nbCol = parseInt(this.imageWidth / this.width, 10),
                i = 0;

            for (i = 0; i < this.nbSprites; i += 1) {
                this.sprites[i] = {
                    x: this.width * (i % nbCol),
                    y: this.height * parseInt(i / nbCol, 10)
                };
            }
        },

        getOffset: function (spriteId) {
            if (this.sprites.length === 0) {
                this.setSprites();
            }
            var sprite = this.sprites[spriteId],
                res = {};

            if (sprite) {
                if (sprite.width) {
                    res = {
                        x: sprite.x,
                        y: sprite.y,
                        width: sprite.width,
                        height: sprite.height
                    };
                } else {
                    res = {
                        x: sprite.x,
                        y: sprite.y,
                        width: this.width,
                        height: this.height
                    };
                }
                return res;
            }
        }
    };

    function Animation(img, sprites, canvas) {
	// array of frames
        this.frames = [];
	// default time transition
        this.time = 0.1;
	// default frame index
        this.frameIndex = 0;
	// current frame duraction
        this.frameDuration = 0;
	// set sprites and canvas
        this.sprites = sprites;
        this.canvas = canvas;
	// load image parameters
        this.load(img);
    }

    Animation.prototype = {
        load: function (img) {
	    // load default time transition
            if (img.getAttribute('data-time')) {
                this.time = img.getAttribute('data-time');
            }
	    // load frames
            if (img.getAttribute('data-frames')) {
                var dataFrames = JSON.parse(img.getAttribute('data-frames')),
                    i = 0;

                if (dataFrames.length !== 0) {
                    for (i = 0; i < dataFrames.length; i += 1) {
                        switch (typeof (dataFrames[i])) {
                        case "number":
                            this.frames[i] = {sprite: dataFrames[i], time: this.time};
                            break;
                        case "object":
                            this.frames[i] = {sprite: dataFrames[i][0], time: dataFrames[i][1]};
                            break;
                        case "string":
                            this.frames[i] = {sprite: dataFrames[i], time: this.time};
                            break;
                        default:
                            break;
                        }
                    }
                }
            }
        },

        setImageDimension: function (imageWidth, imageHeight) {
            this.sprites.imageWidth = imageWidth;
            this.sprites.imageHeight = imageHeight;
        },

        setFrames: function () {
            var i = 0,
                len = 0;
            this.sprites.setNbSprites();
            for (i = 0, len = this.sprites.getNbSprites(); i < len; i += 1) {
                this.frames[i] = {time: this.time};
            }
        },

	// get current sprite to animate
        getSprite: function () {
            var spriteId = this.frameIndex,
                sprite = {};
            if (this.frames.length === 0) {
                this.setFrames();
            }
            if (this.frames[this.frameIndex].sprite !== undefined) {
                spriteId = this.frames[this.frameIndex].sprite;
            }
            sprite = this.sprites.getOffset(spriteId);
            this.frameDuration = this.frames[this.frameIndex].time;
            this.frameIndex += 1;
	    // infinite loop animation
            if (this.frameIndex === this.frames.length) {
                this.frameIndex = 0;
            }
            return sprite;
        },

        getFrameDuration: function () {
	    // convert in millisecond
            return this.frameDuration * 1000;
        },

        drawSprite: function (img) {
            var ctx = this.canvas.getContext('2d'),
                sprite = this.getSprite(),
                t = this;

            ctx.clearRect(0, 0, 300, 300);
            ctx.drawImage(img, sprite.x, sprite.y, sprite.width, sprite.height, 0, 0, this.canvas.width, this.canvas.height);
            window.setTimeout(function () {t.drawSprite(img); }, this.getFrameDuration());
        }
    };

    function initAnimCanvas() {
        var imgs = document.getElementsByTagName("img"),
            i = 0,
            len = 0,
            canvas = {},
            sprites = {},
            anim = {},
            img = {};

	// animate images where parent is canvas
        for (i = 0, len = imgs.length; i < len; i += 1) {
            canvas = imgs[i].parentNode;
            if (canvas.nodeName.toLowerCase() === "canvas") {
                sprites = new SpriteSheet(imgs[i]);
                anim = new Animation(imgs[i], sprites, canvas);
                img = document.createElement('img');
                img.anim = anim;
                img.onload = function () {
                    this.anim.setImageDimension(this.width, this.height);
                    this.anim.drawSprite(this);
                }
                img.src = imgs[i].src;
            }
        }
    }

    //http://scottandrew.com/weblog/articles/cbs-events
    function addEvent(obj, evType, fn, useCapture) {
        if (obj.addEventListener) {
            obj.addEventListener(evType, fn, useCapture);
        } else {
            if (obj.attachEvent) {
                obj.attachEvent("on" + evType, fn);
            } else {
                window.alert("Handler could not be attached");
            }
        }
    }

    // when document is loaded animated images
    if (document.getElementById && document.createTextNode) {
        addEvent(window, 'load', initAnimCanvas);
    }
})();
