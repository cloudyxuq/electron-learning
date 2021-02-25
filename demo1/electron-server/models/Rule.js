var keystone = require("keystone");
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var Rule = new keystone.List("Rule");

Rule.add({
	name: { type: Types.Text, required: true },
	opType: {
		type: Types.Select,
		options: [
			{ value: "INSERT", label: "新增" },
			{ value: "UPDATE", label: "修改" },
		],
	},
	source: {
		urlPattern: { type: Types.Text },
		identifier: { type: Types.Text },
		handler: { type: Types.Code, language: "js", height: 300 },
	},
	destination: {
		urlPattern: { type: Types.Text },
		handler: { type: Types.Code, language: "js", height: 300 },
	},
});

/**
 * Registration
 */
Rule.defaultColumns = "name, opType";
Rule.register();
