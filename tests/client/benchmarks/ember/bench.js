"use strict";

"use strict";

(function(module) {
	var templates = {
		blocks: {},
		helpers: {},
		globals: {},
		cache: {}
	};

	templates.registerHelper = function(name, func) {
		templates.helpers[name] = func;
	};

	templates.parse = function(template, data, bind) {
		return parse(template, registerGlobals(data), bind);
	};

	templates.prepare = function(str) {
		return str;
	};

	templates.render = function(filename, options, fn) {
		var fs = require('fs'),
			tpl = filename.replace(options.settings.views + '/', '');

		if (!templates.cache[tpl]) {
			fs.readFile(filename, function(err, html) {
				templates.cache[tpl] = templates.prepare(html.toString());
				return fn(err, templates.parse(templates.cache[tpl], options));
			});
		} else {
			return fn(null, templates.parse(templates.cache[tpl], options));
		}
	};

	function replace(template, key, value) {
		var searchRegex = new RegExp('{' + key + '}', 'g');
		return template.replace(searchRegex, value);
	}

	function makeRegex(block) {
		return new RegExp("<!--[\\s]*BEGIN " + block + "[\\s]*-->[\\s\\S]*<!--[\\s]*END " + block + "[\\s]*-->", 'g');
	}

	function makeConditionalRegex(block) {
		return new RegExp("<!--[\\s]*IF " + block + "[\\s]*-->([\\s\\S]*?)<!--[\\s]*ENDIF " + block + "[\\s]*-->", 'g');
	}

	function makeStatementRegex(key) {
		return new RegExp("([\\s]*<!--[\\s]*IF " + key + "[\\s]*-->[\\s]*)|([\\s]*<!--[\\s]*ENDIF " + key + "[\\s]*-->[\\s]*)", 'gi');
	}

	function getBlock(template, regex, block) {
		var data = template.match(regex);
		if (data === null) {
			return;
		}

		if (block !== undefined) {
			templates.blocks[block] = data[0];
		}

		var syntax = new RegExp("([\r\n]*<!-- BEGIN " + block + " -->[\r\n]*)|[\r\n]*<!-- END " + block + " -->[\r\n]*", "g");

		return data[0].replace(syntax, "");
	}

	function setBlock(regex, block, template) {
		return template.replace(regex, block);
	}

	function registerGlobals(data) {
		for (var g in templates.globals) {
			if (templates.globals.hasOwnProperty(g)) {
				data[g] = data[g] || templates.globals[g];
			}
		}

		return data;
	}

	function checkConditional(template, key, value) {
		var conditional = makeConditionalRegex(key),
			matches = template.match(conditional);

		if (matches !== null) {
			for (var i = 0, ii = matches.length; i < ii; i++) {
				var conditionalBlock = matches[i].split(/\s*<!-- ELSE -->\s*/),
					statement = makeStatementRegex(key);

				if (conditionalBlock[1]) {
					// there is an else statement
					if (!value) {
						template = template.replace(matches[i], conditionalBlock[1].replace(statement, '').replace(/(^[\s]*)|([\s]*$)/gi, ''));
					} else {
						template = template.replace(matches[i], conditionalBlock[0].replace(statement, '').replace(/(^[\s]*)|([\s]*$)/gi, ''));
					}
				} else {
					// regular if statement
					if (!value) {
						template = template.replace(matches[i], '');
					} else {
						template = template.replace(matches[i], matches[i].replace(statement, '').replace(/(^[\s]*)|([\s]*$)/gi, ''));
					}
				}
			}
		}

		return template;
	}

	function callMethod(method, parameters) {
		return method.apply(templates, [parameters.data, parameters.iterator, parameters.numblocks]);
	}

	function parseFunctions(block, result, parameters) {
		var functions = block.match(/{function.*?}/gi, '');
		for (var fn in functions) {
			if (functions.hasOwnProperty(fn)) {
				var func = functions[fn],
					method = functions[fn].split('.').pop().split('}').shift();

				if (templates.helpers[method]) {
					result = result.replace(new RegExp(func, 'gi'), callMethod(templates.helpers[method], parameters));
				}
			}
		}

		return result;
	}

	function parseArray(template, array, key, namespace, bind) {
		template = checkConditional(template, namespace + 'length', array[key].length);
		template = checkConditional(template, '!' + namespace + 'length', !array[key].length);

		var regex = makeRegex(key),
			block = getBlock(template, regex, namespace.substring(0, namespace.length - 1));

		if (typeof block === "undefined") {
			return template;
		}

		var numblocks = array[key].length - 1,
			iterator = 0,
			result = "";

		do {
			result += '<span data-binding="' + namespace + iterator + '">';
			result += parse(block, array[key][iterator], bind, namespace, {iterator: iterator, total: numblocks}) + ((iterator < numblocks) ? '\r\n':'');
			result += '</span>';
			result = parseFunctions(block, result, {
				data: array[key][iterator],
				iterator: iterator,
				numbloks: numblocks
			});
			array[key][iterator].__template = block;
		} while (iterator++ < numblocks);

		return setBlock(regex, result, template);
	}

	function parseValue(template, key, value, blockInfo) {
		value = typeof value === 'string' ? value.replace(/^\s+|\s+$/g, '') : value;

		template = checkConditional(template, key, value);
		template = checkConditional(template, '!' + key, !value);

		if (blockInfo) {
			template = checkConditional(template, '@first', blockInfo.iterator === 0);
			template = checkConditional(template, '!@first', blockInfo.iterator !== 0);
			template = checkConditional(template, '@last', blockInfo.iterator === blockInfo.total);
			template = checkConditional(template, '!@last', blockInfo.iterator !== blockInfo.total);
		}

		return replace(template, key, value);
	}

	function setupBindings(data, d, namespace, blockInfo, bind, template) {
		var value = data[d];

		data.__namespace = namespace;
		data.__iterator = blockInfo ? blockInfo.iterator : false;
		
		Object.defineProperty(data, d, {
			get: function() {
				return this['__' + d];
			},
			set: function(value) {
				this['__' + d] = value;
				if (this.__namespace && this.__iterator !== false) {
					var els = document.querySelectorAll('[data-binding="' + this.__namespace + this.__iterator + '"]');
					for (var el in els) {
						if (els.hasOwnProperty(el)) {
							els[el].innerHTML = parse(this.__template, data, false, this.__namespace);
						}
					}
				}
			}
		});

		data[d] = value;
	}

	function parse(template, data, bind, namespace, blockInfo) {
		if (!data || data.length === 0) {
			template = '';
		}

		namespace = namespace || '';

		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				if (typeof data[d] === 'undefined') {
					continue;
				} else if (data[d] === null) {
					template = replace(template, namespace + d, '');
				} else if (data[d].constructor === Array) {
					template = parseArray(template, data, d, namespace + d + '.', bind);
				} else if (data[d] instanceof Object) {
					template = parse(template, data[d], bind, namespace + d + '.');
				} else {
					template = parseValue(template, namespace + d, data[d], blockInfo);

					if (bind && data[d]) {
						setupBindings(data, d, namespace, blockInfo, bind, template);
					}
				}
			}
		}

		if (namespace) {
			template = template.replace(new RegExp("{" + namespace + "[\\s\\S]*?}", 'g'), '');
			namespace = '';
		} else {
			// clean up all undefined conditionals
			template = template.replace(/\s*<!-- ELSE -->\s*/gi, 'ENDIF -->\r\n')
								.replace(/\s*<!-- IF([^@]*?)ENDIF([^@]*?)-->/gi, '')
								.replace(/\s*<!-- ENDIF ([^@]*?)-->\s*/gi, '');
		}

		return template;
	}

	module.exports = templates;
	module.exports.__express = module.exports.render;

	if ('undefined' !== typeof window) {
		window.templates = module.exports;
	}

})('undefined' === typeof module ? {
	module: {
		exports: {}
	}
} : module);

// Change N to change the number of drawn circles.

var N = 100;
/*
// The Backbone implementation:
(function(){
	    
	var Box = Backbone.Model.extend({

	    defaults: {
	        top: 0,
	        left: 0,
	        color: 0,
	        content: 0
	    },
	    
	    initialize: function() {
	        this.count = 0;
	    },

	    tick: function() {
	        var count = this.count += 1;
	        this.set({
	            top: Math.sin(count / 10) * 10,
	            left: Math.cos(count / 10) * 10,
	            color: (count) % 255,
	            content: count % 100
	        });
	    }        

	});


	var BoxView = Backbone.View.extend({
	    
	    className: 'box-view',
	    
	    template: _.template($('#underscore-template').html()),
	   
	    initialize: function() {
	        this.model.bind('change', this.render, this);
	    },
	    
	    render: function() {
	        this.$el.html(this.template(this.model.attributes));
	        return this;
	    }
	    
	});

	var boxes;

	var backboneInit = function() {
	    boxes = _.map(_.range(N), function(i) {
	        var box = new Box({number: i});
	        var view = new BoxView({model: box});
	        $('#grid').append(view.render().el);
	        return box;
	    });
	};

	var backboneAnimate = function() {
	    for (var i = 0, l = boxes.length; i < l; i++) {
	      boxes[i].tick();   
	    }
	    window.timeout = _.defer(backboneAnimate);
	};

	window.runBackbone = function() {
	  reset();
	  backboneInit();
	  backboneAnimate();    
	};

})();
*/


// The Ember implementation:
(function(){
	    
	var Box = Ember.Object.extend({
	    
	    top: 0,
	    left: 0,
	    content: 0,
	    count: 0,
	    
	    tick: function() {
	        var count = this.get('count') + 1;
	        this.set('count', count);
	        this.set('top', Math.sin(count / 10) * 10);
	        this.set('left', Math.cos(count / 10) * 10);
	        this.set('color', count % 255);
	        this.set('content', count % 100);
	    },
	    
	    style: function() {
	        return 'top: ' + this.get('top') + 'px; left: ' +  this.get('left') +'px; background: rgb(0,0,' + this.get('color') + ');';
	    }.property('top', 'left', 'color')

	});
	    
	var BoxView = Ember.View.extend({
	    classNames: ['box-view'],
	    templateName: 'box'
	});
	    
	var boxes;

	var emberInit = function() {
	    boxes = _.map(_.range(N), function(i) {
	        var box = Box.create();
	        var view = BoxView.create({model: box});
	        view.appendTo('#grid');
	        box.set('number', i);
	        return box;
	    });
	};

	var emberAnimate = function() {
	    for (var i = 0, l = boxes.length; i < l; i++) {
	      boxes[i].tick();   
	    }
	    window.timeout = _.defer(emberAnimate);
	};

	window.runEmber = function() {
	  reset();
	  emberInit();
	  emberAnimate();    
	};      
    
})();


(function() {
	var boxes = [];
	var template,
			grid;

	function tplsInit() {
		boxes = [];
		template = document.getElementById('templates.js-template').innerHTML,
			grid = document.getElementById('grid');

		var n = N, count = 0;

		while (n--) {
			count++;
			boxes.push({
				top: 0,
			    left: 0,
			    content: 0,
			    count: 0,
			    color: 0,
			    number: count
			});
		}

		grid.innerHTML = templates.parse(template, {boxes: boxes});
	}

	function tplsAnimate() {
		window.timeout = setInterval(function() {
			for (var i = 0, l = boxes.length; i < l; i++) {
				var box = boxes[i];
		    	var count = box.count++;
				box.top = Math.sin(count / 10) * 10;
				box.left = Math.cos(count / 10) * 10;
				box.color = count % 255;
				box.content = count % 100;

				document.getElementById('box-' + box.number).parentNode.innerHTML = templates.parse('<div class="box" id="box-{boxes.number}" style="top: {boxes.top}px; left: {boxes.left}px; background: rgb(0,0,{boxes.color});">{boxes.content}</div>', {boxes: box});
		    }
			
		}, 0);
	}

	window.runTpls = function() {
	   reset();
	   tplsInit();
	   tplsAnimate();
	};

})();

    
window.timeout = null;
window.reset = function() {
  $('#grid').empty();
  clearTimeout(timeout);    
};