# newman-reporter-json-steps

JSON Reporter focused on executed steps in Newman report. Every step contains request, response and test states.

## Motivation

Every json reporters have always some exceptions and incomplete informations. Also written in vanilla node.js compatible with v8 to be easily installed anywhere.

Thanks for inspiration in many other json exports.

## Output structure

```json
{
  "info": {
    "name": "collection name",
    "description": "collection description",
    "env": "description from environment",
    "duration": total_time_in_ms,
    "started": number_of_ms_from_beginning_of_epoch
  },
  "steps": [
    {
      "name": "name of the first step",
      "request": {
        "url": "full url with protocol, path and substituted variables",
        "method": "GET/POST/...",
        "description": "remarks from postman regarding this request",
        "header": {
          "Content-Type": "application/json",
          "Authorization": "Basic hash",
          "Content-Length": "73",
          "...": "..."
        },
        "body": {
          "key": "can be exported as json, if the Content-Type is json",
          "next": "or just string if json is not applicable"
        }
      }
      "response": {
        "body": {
          "access_token": "also can be exported as json structure, or pure string"
        },
        "duration": number_of_ms,
        "header": {
          "Content-Type": "application/json",
          "Content-Length": "5152",
          "...": "..."
        },
        "code": 200,
        "status": "OK"
      },
      "assertions": [
        {
          "name": "Status code is 200",
          "skipped": false,
          "failed": false,
        },
        {
          "name": "Token is valid",
          "skipped": false,
          "failed": true,
          "errorMessage": "expect.fail()"
        }
      ]
    },
    {
      "name": "name of the second step",
      "request": "another request structure",
      "reponse": "another response structure",
      "assertions": "another array of tests"
    },
    {
      "...": "..."
    }
  ],
}
```

[Structures described.](https://github.com/postmanlabs/newman#newmanruncallbackerror-object--summary-object)

## Options

Option | Value | Optional | Note
-- | -- | --
--reporter-json-steps-export | <path/to/generate/json/report> | Yes |
--reporter-json-steps-statsg| | Yes | Include also stats into report

*By default the report is generated in `newman` subfolder of current working directory.*
