/**
 * Custom reporter that dumps adapted structure of JSON report out.
 * Provides JSON response bodies if content-type is application/json, string otherwise.
 *
 * @param {Object} newman - The collection run object, with event hooks for reporting run details.
 * @param {Object} options - A set of collection run options.
 * @param {String} options.export - The path to which the report object must be written.
 * @param options.stats - Include also 'stats' dict in the output report.
 * @returns {*}
 */

const my = require('./package.json');
const prog = 'NR-json-steps@' + my.version;

function info(...msg) {
  console.log('INFO::' + prog, ...msg);
}

function error(...msg) {
  console.log('ERR::' + prog, ...msg);
}

function scrapeDescription(x) {
  if (x == undefined) {
    return undefined;
  }
  var ret = (x.type === 'text/plain') ? x.content : undefined;
  return ret;
}

function convertToJson(body) {
  // wrapped conversion, not every request/response contains well formed json
  try {
    return JSON.parse(body)
  }
  catch (e) {
    return body ? body: '';
  }
}

function compactHeaders(allHeaders) {
  var h = {};
  allHeaders.members.forEach(function (x) {
    h[x.key] = x.value;
  });
  return h;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * -1;
  const offsetHours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
  const offsetMinutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
  const offsetSign = offset >= 0 ? '-' : '+';

  return `${date.toISOString().slice(0, -1)}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

function createLightSummary(rawDetail, options) {
  let detail = {};
  Object.assign(detail, {
    'name': rawDetail.collection.name,
    'description': scrapeDescription(rawDetail.collection.description),
    'env': rawDetail.environment.name,
    'duration': rawDetail.run.timings.completed - rawDetail.run.timings.started,
    'started': rawDetail.run.timings.started,
  });

  let steps = [];
  rawDetail.run.executions.forEach(function (exec) {
    let assertions = [];
    if(exec.assertions !== undefined) {
      exec.assertions.forEach(function (assertionReport) {
        assertions.push({
          'name': assertionReport.assertion,
          'skipped': assertionReport.skipped,
          'failed': assertionReport.error !== undefined,
          'errorMessage': assertionReport.error ? assertionReport.error.message : undefined
        });
      });
    }
    let step = {};
    let request = {};
    Object.assign(request, {
      'url': exec.request.url.toString(),
      'method': exec.request.method,
      'header': compactHeaders(exec.request.headers),
      'body': exec.request.body ? exec.request.body.toString('utf8'): '',
    });
    if (exec.requestError)
      Object.assign(request, {
        'error': exec.requestError
      });
    const CTe = request.header['Content-Type'];
    if (CTe && CTe.includes('application/json'))
      request.body = convertToJson(request.body);
    Object.assign(step, {
      'name': exec.item.name,
      'request': request,
      'assertions': assertions,
    });
    if (exec.requestError == undefined && exec.response) {
      let response = {
        'body': exec.response.stream.toString('utf8'),
        'duration': exec.response.responseTime,
        'header': compactHeaders(exec.response.headers),
        'code': exec.response.code,
        'status': exec.response.status,
      }
      const CTr = response.header['Content-Type'];
      if (CTr && CTr.includes('application/json'))
        response.body = convertToJson(response.body);
      if (CTr && CTr.includes('image/png'))
        response.body = '<<< truncated as image/png content-type >>>';
      Object.assign(step, {
        'response': response,
      });
    }
    steps.push(step);
  });

  var ret = {};
  Object.assign(ret, {
    'info': detail,
    'steps': steps,
  });
  if (options.jsonStepsStats)
    Object.assign(ret, {
      'stats': rawDetail.run.stats,
    });
  return ret;
}

function createXraySummary(rawDetail, options){
  if (options.xrayProjectKey == undefined) {
    throw new Error('Project Key is not provided')
  }

  if (options.xrayTestExecutionKey == undefined) {
    throw new Error('Test Execution Key is not Provided.')
  }

  let steps = [];
  let test_steps = {};
  rawDetail.run.executions.forEach(function (exec) {
    let test_status = 'PASSED';
    let test_failed_details = [];
    if (exec.assertions !== undefined) {
      exec.assertions.forEach(function (assertionReport) {
        if (assertionReport.error) {
          test_status = 'FAILED';
          test_failed_details.push(`${exec.item.name} - Assertion - ${assertionReport.assertion} FAILED. Detail - ${assertionReport.error.message}`);
        }
      });
    }
    if (exec.requestError) {
      test_status = 'FAILED';
      test_failed_details.push(`${exec.item.name} Request Error - ${exec.requestError}`);
    }
    let test_comments = (test_failed_details.length > 0) ? test_failed_details.join('\n') : '';

    let test_key = exec.item.name.match(/\[(.+?)\]/);
    if (test_key == undefined || test_key == null || test_key.length < 2) {
      throw new Error('Test key tag not found');
    }

    test_key = test_key[1];
    if (test_key.startsWith(options.xrayProjectKey) == false) {
      throw new Error('Test key is invalid.')
    }
    if (test_steps[test_key] == undefined) {
      test_steps[test_key] = {
        'status': 'PASSED',
        'comments': [],
        'response_time': 0
      }
    }
    if (test_comments != '') {
      test_steps[test_key].comments.push(test_comments)
    }
    if (test_steps[test_key].status == 'FAILED' || test_status == 'FAILED') {
      test_steps[test_key].status = 'FAILED';
    }
    if (exec.response.responseTime) {
      test_steps[test_key].response_time += (exec.response.responseTime / 1000) || 0;
    }
  });

  Object.keys(test_steps).forEach(function (step) {
    var currentTimestamp = Date.now();
    steps.push({
      'testKey': step,
      'comments': test_steps[step].comments.join('\n'),
      'status': test_steps[step].status,
      'start': `${formatTimestamp(currentTimestamp)}`,
      'finish': `${formatTimestamp(currentTimestamp + Math.round(test_steps[step].response_time))}`,
      "executedBy": "",
      "assignee": "",
      "defects": [],
      "evidence": [],
      "customFields": [],
    })
  })

  let xray_json = {
    "testExecutionKey": options.xrayTestExecutionKey,
    'info': {
      'project': options.xrayProjectKey,
      "summary": "Execution of automated tests",
      "description": "This execution is automatically created when importing execution results from Gitlab",
      "version": "",
      "revision": "",
      "startDate": `${formatTimestamp(rawDetail.run.timings.started)}`,
      "finishDate": `${formatTimestamp(rawDetail.run.timings.completed)}`,
      "testPlanKey": "",
      "testEnvironments": []
    },
    'tests': steps,
  }

  return xray_json;
}


module.exports = function (newman, options) {
  newman.on('beforeDone', function (err, o) {
    // info(options);
    if (err) {
      info('stops on error:', err);
      return;
    }
    
    let exportPath = options.export;
    if (exportPath == undefined) {
      throw new Error('Provide result export path.')
    }

    report_generator_function = createLightSummary
    let exporterName = options.exporterEngine;
    if (exporterName == 'xray-json'){
      report_generator_function = createXraySummary
    }

    try {
      newman.exports.push({
        name: 'all-reporter',
        default: 'newman-step-results.json',
        path: exportPath,
        content: report_generator_function(o.summary, options)
      });
    }
    catch (e) {
      error(e);
    }
    // info('finished');
  });
};
