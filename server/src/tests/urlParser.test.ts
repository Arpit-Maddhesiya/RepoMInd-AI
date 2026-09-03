import { describe, it, expect } from 'vitest';
import { parseGithubUrl, isGithubUrl } from '../services/github/urlParser.js';

describe('parseGithubUrl', () => {
  it('parses a standard https URL', () => {
    expect(parseGithubUrl('https://github.com/expressjs/express')).toEqual({
      owner: 'expressjs',
      repo: 'express',
      branch: null,
    });
  });

  it('parses URLs with trailing slash and .git', () => {
    expect(parseGithubUrl('https://github.com/expressjs/express.git/')).toEqual({
      owner: 'expressjs',
      repo: 'express',
      branch: null,
    });
  });

  it('parses tree URLs and extracts the branch', () => {
    expect(parseGithubUrl('https://github.com/expressjs/express/tree/v5.1.0')).toEqual({
      owner: 'expressjs',
      repo: 'express',
      branch: 'v5.1.0',
    });
  });

  it('parses nested branch paths', () => {
    expect(parseGithubUrl('https://github.com/owner/repo/tree/feature/foo/bar')).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'feature/foo/bar',
    });
  });

  it('parses ssh URLs', () => {
    expect(parseGithubUrl('git@github.com:expressjs/express.git')).toEqual({
      owner: 'expressjs',
      repo: 'express',
      branch: null,
    });
  });

  it('rejects non-GitHub URLs', () => {
    expect(parseGithubUrl('https://gitlab.com/foo/bar')).toBeNull();
    expect(parseGithubUrl('https://example.com')).toBeNull();
  });

  it('rejects malformed URLs', () => {
    expect(parseGithubUrl('not a url')).toBeNull();
    expect(parseGithubUrl('')).toBeNull();
    expect(parseGithubUrl('https://github.com/')).toBeNull();
  });

  it('isGithubUrl matches the parser', () => {
    expect(isGithubUrl('https://github.com/a/b')).toBe(true);
    expect(isGithubUrl('https://gitlab.com/a/b')).toBe(false);
  });
});
