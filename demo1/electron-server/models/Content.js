var keystone = require("keystone");
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var Content = new keystone.List("Content");

Content.add({
	identifier: { type: Types.Text },
	source: { type: Types.Code, language: "json", height: 300 },
	status: {
		type: Types.Select,
		options: [
			{ value: "NEW", label: "新" },
			{ value: "FINISHED", label: "完成" },
			{ value: "FAILED", label: "失败" },
		],
	},
});

/**
 * Relationships
 */
Content.relationship({ ref: "Rule", path: "rule", refPath: "name" });

/**
 * Registration
 */
Content.defaultColumns = "identifier, status, source";
Content.register();
