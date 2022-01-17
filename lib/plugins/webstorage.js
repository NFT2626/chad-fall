ig.module(
	'plugins.webstorage'
)
.defines(function(){ "use strict";

ig.Webstorage = {
	
	support: function (){
		// check support for storage
	},
	get: function (item){
		// *** check support for storage then retrieve
		item = localStorage.getItem(item);
		// console.log('get ' + item);
		return parseInt(item) ? parseInt(item) : 0;
	},
	set: function (item, value){
		// *** check support for storage
		// console.log('set ' + item +' '+ value);
		localStorage.setItem(item, value);
		return value;
	}
	};
});