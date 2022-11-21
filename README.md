# newman-reporter-json-steps

JSON Reporter focused on executed steps in Newman report. Every step contains request, response and test states.

## Motivation

Every json reporters have always some exceptions and incomplete informations. Also written in vanilla node.js compatible with v8 to be easily installed anywhere.

Thanks for inspiration in many other json exports.

## Output structure

[Structures described.](https://github.com/postmanlabs/newman#newmanruncallbackerror-object--summary-object)

## Options

Option | Value | Optional
-- | -- | --
--reporter-json-steps-export | <path/to/generate/json/report> | Yes

*By default the report is generated in `newman` subfolder of current working directory.*
