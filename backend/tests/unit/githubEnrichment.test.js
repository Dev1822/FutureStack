'use strict';

const { enrichWithGithub } = require('../../src/lib/resume-agent/github');

function makeRepo(name, stars) {
    return {
        name,
        html_url: `https://github.com/johndoe/${name}`,
        description: `${name} description`,
        language: 'JavaScript',
        stargazers_count: stars,
        forks_count: 0,
        fork: false,
    };
}

describe('github enrichment metadata', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('keeps full repo history in allReposMeta while limiting contributor lookups', async () => {
        const repos = Array.from({ length: 10 }, (_, index) => makeRepo(`repo-${index}`, 10 - index));
        let contributorCalls = 0;

        global.fetch = jest.fn(async (url) => {
            if (url.includes('/users/johndoe/repos')) {
                return { ok: true, json: async () => repos };
            }
            if (url.includes('/users/johndoe')) {
                return { ok: true, json: async () => ({ public_repos: 10, followers: 5 }) };
            }
            if (url.includes('/contributors')) {
                contributorCalls += 1;
                return {
                    ok: true,
                    json: async () => [{ login: 'johndoe', contributions: 3 }],
                };
            }
            return { ok: false, json: async () => ({}) };
        });

        const result = await enrichWithGithub({
            basics: {
                profiles: [{ network: 'GitHub', url: 'https://github.com/johndoe' }],
            },
        });

        expect(result).not.toBeNull();
        expect(contributorCalls).toBe(6);
        expect(result.projects.length).toBeLessThanOrEqual(6);
        expect(result.allReposMeta).toHaveLength(10);
        expect(result.allReposMeta.map((repo) => repo.name)).toEqual(
            repos.map((repo) => repo.name)
        );
    });
});
