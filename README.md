# newman-reporter-all

Newman reporter for multiple format summary generation.
## Motivation

Every json reporters have always some exceptions and incomplete informations. Also written in vanilla node.js compatible with v8 to be easily installed anywhere.

Thanks for inspiration in many other json exports.

## json-steps Output structure

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

## xray-json Output Structure

```
{
  "testExecutionKey": "WRFL-123",
  "info": {
    "project": "WRFL",
    "summary": "Execution of automated tests",
    "description": "This execution is automatically created when importing execution results from Gitlab",
    "version": "",
    "revision": "",
    "startDate": "2023-07-05T06:18:04.815-05:30",
    "finishDate": "2023-07-05T06:18:10.603-05:30",
    "testPlanKey": "",
    "testEnvironments": []
  },
  "tests": [
    {
      "testKey": "WRFL-144",
      "comments": "[WRFL-144] Step 3: Retrieving Workflow Modules with no matching filters - Assertion - Status code is 200 FAILED. Detail - expected response to have status code 201 but got 200\n[WRFL-144] Step 3: Retrieving Workflow Modules with no matching filters - Assertion - Should contain not contain any Workflow modules data FAILED. Detail - expected 0 to equal 1",
      "status": "FAILED",
      "start": "2023-07-05T06:18:10.606-05:30",
      "finish": "2023-07-05T06:18:10.607-05:30",
      "executedBy": "",
      "assignee": "",
      "defects": [],
      "evidence": [],
      "customFields": []
    }
  ]
}
```

[Structures described.](https://github.com/postmanlabs/newman#newmanruncallbackerror-object--summary-object)

## Options

| Option                                 | Value                        | Required | Note                                                                                |
|----------------------------------------|------------------------------|----------|-------------------------------------------------------------------------------------|
| --reporter-all-export                  | /path/to/save/json/file.json | YES      | Path to dump report                                                                 |
| --reporter-all-exporter-engine         | <reporter engine type>       | NO       | Allowed values are `xray-json`, `json-steps`. By default `json-steps` will be used. |
| --reporter-all-xray-project-key        | <JIRA Project Key>           | YES      | This option is required for `xray-json` exporter. Sample value `WRFL`               |
| --reporter-all-xray-test-execution-key | <JIRA Test Execution Ticket> | YES      | This option is required for `xray-json` exporter. Sample value `WRFL-123`           |
| --reporter-all-json-steps-stats        | No Value required            | No       | This option used for `json-steps` exporter. This includes test stats in report.     |

*By default the report is generated in `newman` subfolder of current working directory.*

## Usage

### json-steps Usage
```bash
newman run https://www.getpostman.com/collections/631643-f695cab7-6878-eb55-7943-ad88e1ccfd65-JsLv \
-r 'all,cli' \
--reporter-all-export './examples/result.json' \
--reporter-all-json-steps-stats
```

### xrya-json Usage
```bash
newman run 'https://www.getpostman.com/collections/631643-f695cab7-6878-eb55-7943-ad88e1ccfd65-JsLv' \
-r 'all,cli' \
--reporter-all-export ./test.json \
--reporter-all-exporter-engine xray-json \
--reporter-all-xray-project-key WRFL \
--reporter-all-xray-test-execution-key WRFL-124
```