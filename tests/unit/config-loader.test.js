// ABOUTME: Unit tests for configuration loading functionality
// ABOUTME: Tests config validation, error handling, and key retrieval

const test = require('ava');
const fs = require('fs');
const path = require('path');

const configLoader = require('../../src/utils/config-loader');

test.beforeEach(t => {
  configLoader.isLoaded = false;
  configLoader.config = null;
});

test('should load valid config file', t => {
  const mockConfig = {
    getSongBpmApiKey: 'test-bpm-key',
    spotifyClientId: 'test-spotify-id',
    spotifyClientSecret: 'test-spotify-secret',
    geniusApiKey: 'test-genius-key'
  };

  const originalReadFileSync = fs.readFileSync;
  const originalExistsSync = fs.existsSync;

  fs.existsSync = () => true;
  fs.readFileSync = () => JSON.stringify(mockConfig);

  const config = configLoader.loadConfig();

  t.deepEqual(config, mockConfig);
  t.is(configLoader.get('getSongBpmApiKey'), 'test-bpm-key');
  t.is(configLoader.get('spotifyClientId'), 'test-spotify-id');

  fs.readFileSync = originalReadFileSync;
  fs.existsSync = originalExistsSync;
});

test('should handle missing config file', t => {
  const originalExistsSync = fs.existsSync;
  fs.existsSync = () => false;

  const config = configLoader.loadConfig();

  t.deepEqual(config, {});
  t.is(configLoader.get('getSongBpmApiKey'), undefined);

  fs.existsSync = originalExistsSync;
});

test('should handle invalid JSON in config file', t => {
  const originalReadFileSync = fs.readFileSync;
  const originalExistsSync = fs.existsSync;

  fs.existsSync = () => true;
  fs.readFileSync = () => 'invalid json';

  const config = configLoader.loadConfig();

  t.deepEqual(config, {});

  fs.readFileSync = originalReadFileSync;
  fs.existsSync = originalExistsSync;
});

test('should cache loaded config', t => {
  const mockConfig = { test: 'value' };
  
  const originalReadFileSync = fs.readFileSync;
  const originalExistsSync = fs.existsSync;
  
  let readCount = 0;
  fs.existsSync = () => true;
  fs.readFileSync = () => {
    readCount++;
    return JSON.stringify(mockConfig);
  };

  configLoader.loadConfig();
  configLoader.loadConfig();

  t.is(readCount, 1);

  fs.readFileSync = originalReadFileSync;
  fs.existsSync = originalExistsSync;
});