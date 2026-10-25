import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeHistory, normalizeReading } from './file-history.mjs';

const temporary = await mkdtemp(path.join(os.tmpdir(), 'bf6-history-push-'));
const remote = path.join(temporary, 'remote.git');
const runner = path.join(temporary, 'runner');
const writer = path.join(temporary, 'writer');
const historyPath = 'public/data/bf6-stats-history.json';
const snapshotPath = 'public/data/bf6-stats-snapshot.json';
const root = fileURLToPath(new URL('../', import.meta.url));
const git = (cwd, ...args) => execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const json = (cwd, file, value) => writeFile(path.join(cwd, file), JSON.stringify(value) + '\n');
const read = async (cwd, file) => JSON.parse(await readFile(path.join(cwd, file), 'utf8'));
const configure = cwd => { git(cwd, 'config', 'user.name', 'History test'); git(cwd, 'config', 'user.email', 'history-test@example.invalid'); git(cwd, 'config', 'core.hooksPath', path.join(temporary, 'no-hooks')); };

try {
  await mkdir(runner);
  git(temporary, 'init', '--bare', remote);
  git(runner, 'init', '-b', 'main');
  configure(runner);
  git(runner, 'remote', 'add', 'origin', remote);
  await mkdir(path.join(runner, 'scripts'));
  await mkdir(path.join(runner, 'public/data'), { recursive: true });
  for (const file of ['file-history.mjs', 'snapshot-bf6.mjs']) await cp(path.join(root, 'scripts', file), path.join(runner, 'scripts', file));
  const bundled = await read(root, snapshotPath);
  const fixture = Object.values(bundled.players)[0];
  const player = (day, kills) => ({ ...fixture, capturedAt: `2026-10-0${day}T12:00:00Z`, response: { ...fixture.response, dividedKills: { human: kills }, deaths: 50 } });
  const first = { players: { A: player(1, 100) } };
  const captured = { players: { A: player(2, 120) } };
  const newer = { players: { A: player(3, 150) } };
  const initialHistory = mergeHistory({ version: 2, players: {} }, first);
  await json(runner, historyPath, initialHistory);
  await json(runner, snapshotPath, first);
  git(runner, 'add', '.'); git(runner, 'commit', '-m', 'Initial history'); git(runner, 'push', '-u', 'origin', 'main');
  git(temporary, 'clone', '--branch', 'main', remote, writer); configure(writer);
  const captureFile = path.join(temporary, 'capture.json');
  await writeFile(captureFile, JSON.stringify(captured));
  const merge = () => execFileSync(process.execPath, ['scripts/file-history.mjs', '--merge-snapshot', captureFile], { cwd: runner, stdio: 'pipe' });

  merge();
  git(runner, 'add', historyPath, snapshotPath); git(runner, 'commit', '-m', 'Local capture');
  // Another actor advances main between checkout/capture and the bot's push.
  await json(writer, historyPath, mergeHistory(initialHistory, newer));
  await json(writer, snapshotPath, newer);
  await writeFile(path.join(writer, 'source-change.txt'), 'Keep the concurrent source change.\n');
  git(writer, 'add', '.'); git(writer, 'commit', '-m', 'Concurrent source and newer data'); git(writer, 'push', 'origin', 'main');
  const rejected = spawnSync('git', ['push', 'origin', 'HEAD:main'], { cwd: runner, encoding: 'utf8' });
  assert.notEqual(rejected.status, 0, 'The fixture must reproduce the rejected push');

  // Same recovery sequence as the workflow: undo only our bot commit and merge again.
  git(runner, 'reset', '--soft', 'HEAD^');
  git(runner, 'restore', '--source=HEAD', '--staged', '--worktree', '--', historyPath, snapshotPath);
  git(runner, 'pull', '--ff-only', 'origin', 'main');
  merge();
  git(runner, 'add', historyPath, snapshotPath); git(runner, 'commit', '-m', 'Merged capture'); git(runner, 'push', 'origin', 'HEAD:main');

  const result = await read(runner, historyPath);
  assert.deepEqual(result.players.A.map(r => r.values.kills), [100, 120, 150], 'Remote history and delayed captured days both survive');
  assert.deepEqual(result.players.A[1], normalizeReading(captured.players.A));
  assert.deepEqual((await read(runner, snapshotPath)).players.A, newer.players.A, 'Fallback stays at the newest capture');
  assert.equal((await readFile(path.join(runner, 'source-change.txt'), 'utf8')).trimEnd(), 'Keep the concurrent source change.');
  assert.equal(git(runner, 'status', '--porcelain'), '');
  assert.equal(git(remote, 'rev-parse', 'main'), git(runner, 'rev-parse', 'HEAD'));
  console.log('PASS actual Git push rejection and retry, concurrent source preservation, delayed daily reading and newest fallback.');
} finally {
  const resolved = path.resolve(temporary);
  if (path.dirname(resolved) === path.resolve(os.tmpdir()) && path.basename(resolved).startsWith('bf6-history-push-')) await rm(resolved, { recursive: true, force: true });
}
