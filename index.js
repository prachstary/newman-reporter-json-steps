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
  if (x == undefined) { return undefined; }
  var ret = (x.type === 'text/plain') ? x.content : undefined;
  return ret;
}

function convertToJson(body) {
  // wrapped conversion, not every request/response contains well formed json
  try {
    return JSON.parse(body)
  }
  catch (e) {
    return body ? body : '';
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
    "startDate": `${formatTimestamp(rawDetail.run.timings.started)}`,
    "finishDate": `${formatTimestamp(rawDetail.run.timings.completed)}`,
  });

  let steps = [];
  rawDetail.run.executions.forEach(function (exec) {
    let test_status = 'PASSED';
    let failed_details = [];
    if (exec.assertions !== undefined) {
      exec.assertions.forEach(function (assertionReport) {
        if (assertionReport.error) {
          test_status = 'FAILED';
          failed_details.push(`${exec.item.name} - Assertion - ${assertionReport.assertion} FAILED. Detail - ${assertionReport.error.message}`);
        }
      });
    }
    let step = {};
    if (exec.requestError) {
      test_status = 'FAILED';
      failed_details.push(`${exec.item.name} Request Error - ${exec.requestError}`);
    }
    let test_comments = (failed_details.length > 0) ? failed_details.join('\n') : '';
    var currentTimestamp = Date.now();
    console.log(currentTimestamp);

    Object.assign(step, {
      'testKey': exec.item.name.split(' ')[0],
      'comments': test_comments,
      'status': test_status,
      'start': `${formatTimestamp(currentTimestamp)}`,
    });
    // console.log(exec.response);
    steps.push(step);
  });

  var ret = {};
  Object.assign(ret, {
    'info': detail,
    'tests': steps,
  });
  console.log(ret);
  return ret;
}

module.exports = function (newman, options) {
  newman.on('beforeDone', function (err, o) {
    // info(options);
    if (err) {
      info('stops on error:', err);
      return;
    }
    try {
      newman.exports.push({
        name: 'json-steps-reporter',
        default: 'newman-step-results.json',
        path: options.xrayJsonExport,
        content: createLightSummary(o.summary, options)
      });
    }
    catch (e) {
      error(e);
    }
    // info('finished');
  });
};
