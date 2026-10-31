/*
 * NFR-01 response-time measurement. Start the seeded server, then run `npm run perf`.
 * Each run sends 11 login requests, and logins are limited to 20 per 15 minutes per IP,
 * so wait 15 minutes between runs (or restart the server) or the second run reports 429 errors.
 * Results are written to docs/perf/nfr-01-results.json. The exit code is 1 if the target is missed.
 */
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const studentEmail = process.env.PERF_STUDENT_EMAIL || 'ravi@oipp.test';
const studentPassword = process.env.PERF_STUDENT_PASSWORD || 'Student@123';
const TOTAL_REQUESTS = 250;
const CONCURRENCY = 10;

async function request(method, endpoint, body, token) {
  const started = performance.now();
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`${method} ${endpoint} returned ${response.status}: ${payload?.error?.code || 'HTTP_ERROR'}`);
    }
    return { payload, durationMs: performance.now() - started };
  } catch (error) {
    error.durationMs = performance.now() - started;
    throw error;
  }
}

async function login(email, password) {
  const response = await request('POST', '/login', { email, password });
  return response.payload.data.token;
}

function percentile(values, percentileRank) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileRank / 100) * sorted.length) - 1);
  return sorted[index] || 0;
}

function printReport(records) {
  const grouped = new Map();
  records.forEach((record) => {
    if (!grouped.has(record.label)) grouped.set(record.label, []);
    grouped.get(record.label).push(record);
  });
  const rows = [...grouped.entries()].map(([endpoint, endpointRecords]) => {
    const durations = endpointRecords.map((record) => record.durationMs);
    return {
      endpoint,
      count: durations.length,
      minMs: Number(Math.min(...durations).toFixed(2)),
      avgMs: Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2)),
      p95Ms: Number(percentile(durations, 95).toFixed(2)),
      maxMs: Number(Math.max(...durations).toFixed(2)),
      errors: endpointRecords.filter((record) => record.error).length,
    };
  });
  const successful = records.filter((record) => !record.error);
  const withinTarget = successful.filter((record) => record.durationMs <= 3000).length;
  const overallPercentUnderThreeSeconds = Number(((withinTarget / records.length) * 100).toFixed(2));
  const overallP95Ms = Number(percentile(records.map((record) => record.durationMs), 95).toFixed(2));
  rows.forEach((row) => {
    process.stdout.write(`${row.endpoint}: count ${row.count}, min ${row.minMs} ms, avg ${row.avgMs} ms, p95 ${row.p95Ms} ms, max ${row.maxMs} ms, errors ${row.errors}\n`);
  });
  process.stdout.write(`Overall: ${records.length} requests; p95 ${overallP95Ms} ms; ${overallPercentUnderThreeSeconds}% <= 3000 ms; ${records.length - successful.length} errors\n`);
  return { rows, overallP95Ms, overallPercentUnderThreeSeconds, totalRequests: records.length, errors: records.length - successful.length };
}

async function main() {
  process.stdout.write(`Running ${TOTAL_REQUESTS} requests against ${BASE_URL} with concurrency ${CONCURRENCY}\n`);
  const studentToken = await login(studentEmail, studentPassword);

  const internshipsResponse = await request('GET', '/internships', null, studentToken);
  const internships = internshipsResponse.payload.data.items || [];
  if (internships.length === 0) throw new Error('No internships found. Run npm run seed before npm run perf.');
  const internshipId = internships[0].id;

  const getSpecs = [
    ['GET /internships', '/internships'],
    ['GET /internships?search=software', '/internships?search=software'],
    ['GET /internships?category=Software%20Development', '/internships?category=Software%20Development'],
    ['GET /internships?location=Bengaluru', '/internships?location=Bengaluru'],
    ['GET /internships/:id', `/internships/${internshipId}`],
    ['GET /applications', '/applications'],
    ['GET /tests', '/tests'],
    ['GET /results', '/results'],
    ['GET /progress', '/progress'],
    ['GET /analysis', '/analysis'],
  ];
  const workload = [
    ...Array.from({ length: 10 }, () => ({ label: 'POST /login', method: 'POST', endpoint: '/login', body: { email: studentEmail, password: studentPassword } })),
    ...getSpecs.flatMap(([label, endpoint]) => Array.from({ length: 24 }, () => ({ label, method: 'GET', endpoint }))),
  ];
  const records = [];
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < workload.length) {
      const spec = workload[nextIndex++];
      try {
        const result = await request(spec.method, spec.endpoint, spec.body, studentToken);
        records.push({ label: spec.label, durationMs: result.durationMs });
      } catch (error) {
        records.push({ label: spec.label, durationMs: error.durationMs || 0, error: error.message });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const report = printReport(records);
  const outputPath = path.join(__dirname, '../../docs/perf/nfr-01-results.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ baseUrl: BASE_URL, generatedAt: new Date().toISOString(), concurrency: CONCURRENCY, ...report }, null, 2)}\n`);
  if (report.totalRequests !== TOTAL_REQUESTS || report.errors > 0 || report.overallPercentUnderThreeSeconds < 95) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`Performance test failed: ${error.message}\n`);
  process.exitCode = 1;
});
