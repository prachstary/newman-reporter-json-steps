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

function createLightSummary(rawDetail, options) {
  let detail = {};
  Object.assign(detail, {
    'name': rawDetail.collection.name,
    'description': rawDetail.collection.description.content,
    'env': rawDetail.environment.name
  });

  let steps = [];
  rawDetail.run.executions.forEach(function (exec) {
    let assertions = [];
    exec.assertions.forEach(function (assertionReport) {
      assertions.push({
        'name': assertionReport.assertion,
        'skipped': assertionReport.skipped,
        'failed': assertionReport.error !== undefined,
        'errorMessage': assertionReport.error ? assertionReport.error.message : undefined
      });
    });
    let step = {};
    Object.assign(step, {
      'name': exec.item.name,
      'request': exec.request,
      'requestError': exec.requestError,
      'assertions': assertions,
    });
    if (exec.requestError == undefined && exec.response) {
      let response = {
        'body': exec.response.stream.toString('utf8'),
        'duration': exec.response.responseTime,
        'headers': exec.response.header,
        'code': exec.response.code,
        'status': exec.response.status,
      }
      Object.assign(step, {
        'response': response,
      });
    }
    steps.push(step);
  });

  let executions = [];

  rawDetail.run.executions.forEach(function (executionReport) {

    let requestError = executionReport.requestError;
    let responseBody = undefined;
    if (executionReport.requestError == undefined) {
      if (executionReport.response)
        responseBody = executionReport.response.stream;
      if (executionReport.response.headers) {
        executionReport.response.headers.members.forEach(function (header) {
          if (header.key === 'Content-Type') {
            if (header.value.includes('application/json'))
              responseBody = JSON.parse(responseBody.toString('utf8'));
            else
              responseBody = responseBody.toString('ascii');
          }
        });
      }
    }

    executions.push({
      'id': executionReport.id,
      'request': executionReport.request,
      'requestError': requestError,
      'response': responseBody ? {
        'headers': executionReport.response ? executionReport.response.headers: undefined,
        'code': executionReport.response ? executionReport.response.code: undefined,
        'status': executionReport.response ? executionReport.response.status: undefined,
        'body': responseBody,
      } : undefined,
    });
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

module.exports = function (newman, options) {
  newman.on('beforeDone', function (err, o) {
    info(options);
    if (err) {
      info('stops on error:', err);
      return;
    }
    try {
      newman.exports.push({
        name: 'json-steps-reporter',
        default: 'newman-step-results.json',
        path: options.jsonStepsExport,
        content: createLightSummary(o.summary, options)
      });
    }
    catch (e) {
      error(e);
      throw e;
    }
    info('finished');
  });
};
