import { describe, it, expect } from 'vitest';
import { getFiles } from '../packs/funding/index.mjs';

describe('funding pack', () => {
    describe('getFiles', () => {
        it('should return empty array when funding is disabled', () => {
            /** @type {any} */
            const config = {
                funding: {
                    enabled: false,
                    providers: {
                        github: ['testuser'],
                    },
                },
            };

            const files = getFiles(config);

            expect(files).toEqual([]);
        });

        it('should return empty array when enabled but no providers configured', () => {
            /** @type {any} */
            const config = {
                funding: {
                    enabled: true,
                    providers: {},
                },
            };

            const files = getFiles(config);

            expect(files).toEqual([]);
        });

        it('should return empty array when enabled but providers are empty', () => {
            /** @type {any} */
            const config = {
                funding: {
                    enabled: true,
                    providers: {
                        github: [],
                        open_collective: '',
                        ko_fi: '',
                    },
                },
            };

            const files = getFiles(config);

            expect(files).toEqual([]);
        });

        it('should return FUNDING.yml when enabled and github provider has values', () => {
            /** @type {any} */
            const config = {
                funding: {
                    enabled: true,
                    providers: {
                        github: ['testuser'],
                    },
                },
            };

            const files = getFiles(config);

            expect(files).toEqual(['.github/FUNDING.yml']);
        });

        it('should return FUNDING.yml when enabled and open_collective is set', () => {
            /** @type {any} */
            const config = {
                funding: {
                    enabled: true,
                    providers: {
                        open_collective: 'my-collective',
                    },
                },
            };

            const files = getFiles(config);

            expect(files).toEqual(['.github/FUNDING.yml']);
        });

        it('should return FUNDING.yml when enabled and ko_fi is set', () => {
            /** @type {any} */
            const config = {
                funding: {
                    enabled: true,
                    providers: {
                        ko_fi: 'mykofi',
                    },
                },
            };

            const files = getFiles(config);

            expect(files).toEqual(['.github/FUNDING.yml']);
        });

        it('should return FUNDING.yml when enabled and multiple providers are set', () => {
            /** @type {any} */
            const config = {
                funding: {
                    enabled: true,
                    providers: {
                        github: ['user1', 'user2'],
                        open_collective: 'collective',
                        ko_fi: 'kofi',
                    },
                },
            };

            const files = getFiles(config);

            expect(files).toEqual(['.github/FUNDING.yml']);
        });

        it('should require both enabled=true AND providers', () => {
            const configs = [
                // Disabled with providers
                {
                    funding: {
                        enabled: false,
                        providers: { github: ['user'] },
                    },
                },
                // Enabled without providers
                {
                    funding: {
                        enabled: true,
                        providers: {},
                    },
                },
                // Enabled with empty providers
                {
                    funding: {
                        enabled: true,
                        providers: {
                            github: [],
                        },
                    },
                },
            ];

            for (const config of configs) {
                /** @type {any} */
                const c = config;

                expect(getFiles(c)).toEqual([]);
            }
        });
    });
});
