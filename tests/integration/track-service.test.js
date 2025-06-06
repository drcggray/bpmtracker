// ABOUTME: Integration tests for track service functionality
// ABOUTME: Tests end-to-end track data retrieval with mocked APIs

const test = require('ava');
const trackService = require('../../src/services/track-service');

test.beforeEach(t => {
  trackService.setAccessToken('mock-token');
});

test('should handle missing authentication', async t => {
  trackService.setAccessToken(null);
  const result = await trackService.getCurrentlyPlaying();
  t.is(result.error, 'Not authenticated');
});

test('should handle missing lyrics parameters', async t => {
  const result = await trackService.getLyrics(null, 'Artist');
  t.is(result.error, 'Missing track or artist name');
  
  const result2 = await trackService.getLyrics('Track', null);
  t.is(result2.error, 'Missing track or artist name');
});

test('should handle queue fetch without authentication', async t => {
  trackService.setAccessToken(null);
  const result = await trackService.getQueue();
  t.is(result.error, 'Not authenticated');
});