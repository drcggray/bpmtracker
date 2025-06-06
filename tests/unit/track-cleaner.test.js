// ABOUTME: Unit tests for track title cleaning functionality
// ABOUTME: Tests removal of parentheses, brackets, and common suffixes

const test = require('ava');
const TrackCleaner = require('../../src/utils/track-cleaner');

test('should remove content in parentheses', t => {
  const input = 'Song Title (feat. Artist)';
  const expected = 'Song Title';
  const result = TrackCleaner.cleanTrackTitle(input);
  t.is(result, expected);
});

test('should remove content in square brackets', t => {
  const input = 'Song Title [Bonus Track]';
  const expected = 'Song Title';
  const result = TrackCleaner.cleanTrackTitle(input);
  t.is(result, expected);
});

test('should remove remastered suffix', t => {
  const input = 'Song Title - Remastered';
  const expected = 'Song Title';
  const result = TrackCleaner.cleanTrackTitle(input);
  t.is(result, expected);
});

test('should remove live version suffix', t => {
  const input = 'Song Title - Live Version';
  const expected = 'Song Title';
  const result = TrackCleaner.cleanTrackTitle(input);
  t.is(result, expected);
});

test('should handle multiple cleaning operations', t => {
  const input = 'Song Title (feat. Artist) - Remastered Version [Bonus]';
  const expected = 'Song Title';
  const result = TrackCleaner.cleanTrackTitle(input);
  t.is(result, expected);
});

test('should return original title if cleaning results in empty string', t => {
  const input = '(feat. Artist)';
  const result = TrackCleaner.cleanTrackTitle(input);
  t.is(result, input);
});

test('should handle empty or null input', t => {
  t.is(TrackCleaner.cleanTrackTitle(''), '');
  t.is(TrackCleaner.cleanTrackTitle(null), '');
  t.is(TrackCleaner.cleanTrackTitle(undefined), '');
});

test('should handle titles with no cleaning needed', t => {
  const input = 'Clean Song Title';
  const result = TrackCleaner.cleanTrackTitle(input);
  t.is(result, input);
});