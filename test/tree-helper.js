var chai = require("chai");
var expect = chai.expect;
chai.should();

var treeHelper = require("../app/lib/tree-helper");

/* global describe, it */

describe("makeNode", function () {
	it ("should make a node from a string", function () {
		treeHelper.makeNode("hello").should.deep.equal({name: "hello"});
	});
	it ("should not change a node ", function () {
		treeHelper.makeNode({name: "hello"}).should.deep.equal({name: "hello"});
	});
});

describe("makeTreeFromPath", function () {
	it ("sould bail on an empty path", function() {
		/* jshint expr:true */
		expect(treeHelper.makeTreeFromPath([])).to.not.be.ok;
	});
	it ("sould convert a string path of length one", function () {
		treeHelper.makeTreeFromPath(["hello"]).should.deep.equal({name: "hello"});
	});
	it ("sould convert an object path of length one", function () {
		treeHelper.makeTreeFromPath([{name: 'hello'}]).should.deep.equal({name: "hello"});
	});
	it ("sould convert a string path of length 2", function () {
		treeHelper.makeTreeFromPath(["hello", "world"]).should.deep.equal({name: "hello", children: [{name: 'world'}]});
	});
	it ("sould convert a mixed path of length 3", function () {
		treeHelper.makeTreeFromPath(["hello", "world", {name: "and kittens"}]).should.deep.equal({
			name: "hello",
			children: [
				{name: 'world', children: [{
					name: "and kittens"
				}]}
			]
		});
	});
	it ("should attach my data to the end of the tree", function () {
		treeHelper.makeTreeFromPath(["a", "b", "c"], function (endNode) {
			endNode.messages = [1, 2];
		}).should.deep.equal({
			name: 'a',
			children: [{
				name: 'b',
				children: [{
					name: 'c',
					messages: [1, 2]
				}]
			}]
		});
	});
});

describe("mergeTrees", function () {
	it ("should leave tree alone if mergee is falsey", function () {
		treeHelper.mergeTrees({name: 'a'}, null).should.deep.equal({name: 'a'});
	});
	it ("should return mergee if target is falsey", function () {
		treeHelper.mergeTrees(null, {name: 'a'}).should.deep.equal({name: 'a'});
	});
	it ("should update target if nodes have the same name", function () {
		treeHelper.mergeTrees({name: 'a'}, {name: 'a', prop: 42}).should.deep.equal({name: 'a', prop: 42});
	});
	it ("should create a new root node if the merged trees don't have the same root", function () {
		treeHelper.mergeTrees({name: 'a'}, {name: 'b'}).should.deep.equal(
			{
				name: 'a, b',
				children: [
					{name: 'a'},
					{name: 'b'}
				]
			}
		);
	});
	it("should append the children of merged tree if the root is the same", function () {
		treeHelper.mergeTrees({name: 'a'}, {name: 'a', children: [{name: 'b'}, {name: 'c'}]}).should.deep.equal(
			{
				name: 'a',
				children: [
					{name: 'b'},
					{name: 'c'}
				]
			}
		);
	});
	it("should merge the children of merged tree if their names are the same", function () {
		treeHelper.mergeTrees({name: 'a', children:[{name: 'b', prop: 42}]}, {name: 'a', children: [{name: 'b', otherProp: 84}]}).should.deep.equal(
			{
				name: 'a',
				children: [
					{name: 'b', prop: 42, otherProp: 84}
				]
			}
		);
	});
	it("should merge the nested children of merged tree if their names are the same", function () {
		treeHelper.mergeTrees(
			{name: 'a', children:[{name: 'b', prop: 42, children:[{name: 'c', x:1}, {name: 'd'}]}]},
			{name: 'a', children: [{name: 'b', otherProp: 84, children:[{name: 'c', y:2}]}]}
		).should.deep.equal(
			{
				name: 'a',
				children: [
					{
						name: 'b',
						prop: 42,
						otherProp: 84,
						children: [{name: 'c', x:1, y:2}, {name: 'd'}]
					}
				]
			}
		);
	});
	it ("should use a custom merge function when properties collide", function () {
		treeHelper.mergeTrees({
			name: 'a',
			children: [{
				name: 'b',
				children: [{
					name: 'c',
					messages: ['x']
				}]
			}]
		},{
			name: 'a',
			children: [{
				name: 'b',
				children: [{
					name: 'c',
					messages: ['y']
				}]
			}]
		}, function (property, oldValue, newValue) {
			if (property === 'messages') {
				return oldValue.concat(newValue);
			} else {
				return newValue;
			}
		}).should.deep.equal({
			name: 'a',
			children: [{
				name: 'b',
				children: [{
					name: 'c',
					messages: ['x', 'y']
				}]
			}]
		});
	});
	it("should merge a path into a tree", function () {
		treeHelper.mergePath({name: 'a', children: [{name: 'b'}]}, ['a', 'b', 'c', 'd']).should.deep.equal({
			name: 'a',
			children: [{
				name: 'b',
				children: [{
					name: 'c',
					children: [{
						name: 'd'
					}]
				}]
			}]
		});
	});
	it("should merge a path into a big tree", function () {
		var tree = {
			"id": 1,
			"lft": 1,
			"rgt": 8,
			"name": "PrestaShop Core",
			"technical_data": null,
			"children": [
				{
					"id": 2,
					"lft": 2,
					"rgt": 7,
					"name": "1.6.0.9",
					"technical_data": null,
					"children": [
						{
							"id": 3,
							"lft": 3,
							"rgt": 6,
							"name": "modules",
							"technical_data": null,
							"children": [
								{
									"id": 4,
									"lft": 4,
									"rgt": 5,
									"name": "bankwire",
									"technical_data": null
								}
							]
						}
					]
				}
			]
		};

		var path = [
			"PrestaShop Core",
			"1.6.0.9",
			"modules",
			"autoupgrade"
		];

		var exected = {
			"id": 1,
			"lft": 1,
			"rgt": 8,
			"name": "PrestaShop Core",
			"technical_data": null,
			"children": [
				{
					"id": 2,
					"lft": 2,
					"rgt": 7,
					"name": "1.6.0.9",
					"technical_data": null,
					"children": [
						{
							"id": 3,
							"lft": 3,
							"rgt": 6,
							"name": "modules",
							"technical_data": null,
							"children": [
								{
									"id": 4,
									"lft": 4,
									"rgt": 5,
									"name": "bankwire",
									"technical_data": null
								},
								{
									"name": "autoupgrade"
								}
							]
						}
					]
				}
			]
		};

		treeHelper.mergePath(tree, path).should.deep.equal(exected);
	});
});

describe("flatten trees", function () {
	it ('should flatten a tree without children', function () {
		treeHelper.flatten({name: 'a'}).should.deep.equal([{name: 'a'}]);
	});
	it ('should flatten a tree with children', function () {
		treeHelper.flatten({name: 'a', children:[{name: 'b', children: [{name: 'c'}]}]}).should.deep.equal([
			{name: 'a'},
			{name: 'b'},
			{name: 'c'}
		]);
	});
});

describe("number trees", function () {
	it ('should number a leaf', function () {
		treeHelper.number({name: 'a'}).should.deep.equal({name: 'a', lft: 1, rgt: 2});
	});
	it ('should number a tree with children', function () {
		treeHelper.number({name: 'a', children:[{name: 'b'}, {name: 'c'}]}).should.deep.equal(
			{name: 'a', lft: 1, rgt: 6, children:[{name: 'b', lft: 2, rgt: 3}, {name: 'c', lft: 4, rgt: 5}]}
		);
	});
});

describe("unFlattenNumberedTree", function () {
	it ("should unflatten a single node", function () {
		treeHelper.unFlattenNumberedTree([{name: 'a', lft: 1, rgt: 2}]).should.deep.equal({name: 'a', lft: 1, rgt: 2});
	});
	it ("should unflatten a 3 nodes tree", function () {
		treeHelper.unFlattenNumberedTree([
			{name: 'b', lft: 2, rgt: 3},
			{name: 'a', lft: 1, rgt: 6},
			{name: 'c', lft: 4, rgt: 5}
		]).should.deep.equal({
			name: 'a', lft: 1, rgt: 6,
			children: [{
				name: 'b', lft: 2, rgt: 3
			}, {
				name: 'c', lft: 4, rgt: 5
			}]
		});
	});
});

describe("getNodesAtDepth", function () {
	it ("Should find nodes at depth 1", function () {
		treeHelper.getNodesAtDepth({
			name: 'a',
			children: [{name: 'b'}]
		}, 1)
		.should.deep.equal([{
			name: 'a',
			children: [{name: 'b'}]
		}]);
	});
	it ("Should find nodes at depth 2", function () {
		treeHelper.getNodesAtDepth({
			name: 'a',
			children: [{name: 'b'}]
		}, 2)
		.should.deep.equal([{
			name: 'b'
		}]);
	});
	it ("Should find nodes at depth 3", function () {
		treeHelper.getNodesAtDepth({
			name: 'a',
			children: [{name: 'b', children: [{name: 'c'}]}, {name: 'd', children: [{name: 'e'}]}]
		}, 3)
		.should.deep.equal([{
			name: 'c'
		},{
			name: 'e'
		}]);
	});
});

describe ("reduce tree", function () {
	it("Should reduce a one node tree", function () {
		treeHelper.reduce({
			name: 'a', k: 1
		}, function (soFar, node) {
			return soFar + node.k;
		}, 0).should.equal(1);
	});
	it("Should reduce 2 node tree", function () {
		treeHelper.reduce({
			name: 'a', k: 1,
			children: [{
				name: 'b', k: 2
			}]
		}, function (soFar, node) {
			return soFar + node.k;
		}, 0).should.equal(3);
	});
	it("Should reduce 4 node tree", function () {
		treeHelper.reduce({
			name: 'a', k: 1,
			children: [{
				name: 'b', k: 2,
				children: [{name: 'c', k: 3}]
			}, {
				name: 'd', k: 4
			}]
		}, function (soFar, node) {
			return soFar + node.k;
		}, 0).should.equal(10);
	});
});