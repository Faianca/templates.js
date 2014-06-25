"use strict";

window.json = {
	"animals": [
		{
			"name": "Cat",
			"species": "Felis silvestris catus",
			"isHuman": false,
			"pet": {
				"trainable": true,
				"info": "Hates dogs, eats goldfish",
				"groups": [
					{
						name: "group a"
					},
					{
						name: "group b"
					},
					{
						name: "group c"
					}
				]
			},
			"hates": [
				{
					"name": "dogs"
				},
				{
					"name": "humans"
				}
			]
		},
		{
			"name": "Dog",
			"species": "Canis lupus familiaris",
			"isHuman": false,
			"pet": {
				"trainable": true,
				"info": "Hates cats",
				"groups": [
					{
						name: "group d"
					}
				]
			},
			"hates": [
				{
					"name": "cats"
				},
				{
					"name": "goldfish"
				}
			]
		},
		{
			"name": "Goldfish",
			"species": "Carassius auratus auratus",
			"isHuman": false,
			"pet": {
				"trainable": false,
				"info": "Keep away from cats",
				"groups": [
					{
						name: "group e"
					},
					{
						name: "group b"
					},
					{
						name: "group c"
					}
				]
			},
			"hates": [
				{
					"name": "cats"
				},
				{
					"name": "dogs"
				},
				{
					"name": "humans"
				}
			]
		},
		{
			"name": "Human",
			"species": "Homo sapiens",
			"isHuman": true,
			"hobbies": [
				{
					"name": "guitar",
				}, 
				{
					"name": "programming",
				}, 
				{
					"name": "sports"
				}
			]
		}
	],
	"package": {
		"name": "templates.js",
		"author": "psychobunny",
		"url": "http://www.github.com/psychobunny/templates.js"
	},
	"forum": "NodeBB",
	"language": "JavaScript",
	"isTrue": true,
	"isFalse": false,
	"website": "http://burnaftercompiling.com",
    "sayHello": true,
	"header": "Colors",
	"items": [
		{
			"name": "rainbow",
			"url": "#Rainbow"
		},
		{
			"name": "red",
			"link": true,
			"url": "#Red"
		},
		{
			"name": "orange",
			"link": true,
			"url": "#Orange"
		},
		{
			"name": "yellow",
			"link": true,
			"url": "#Yellow"
		},
		{
			"name": "green",
			"link": true,
			"url": "#Green"
		},
		{
			"name": "blue",
			"link": true,
			"url": "#Blue"
		},
		{
			"name": "purple",
			"link": true,
			"url": "#Purple"
		},
		{
			"name": "white",
			"link": false,
			"url": "#While"
		},
		{
			"name": "black",
			"link": false,
			"url": "#Black"
		}
	],
	"double": true,
	"single": false,
	"config": {
		"allowLocalLogin": false
	},
	"alternate_logins": true,
	"some_other": false,
	"user": {
		"username":"baris",
		"userslug":"baris"
	},
	"userslug": "baris",
	"username": "baris"
};