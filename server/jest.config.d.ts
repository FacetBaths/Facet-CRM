declare const config: {
    preset: string;
    testEnvironment: string;
    roots: string[];
    moduleFileExtensions: string[];
    transform: {
        '^.+\\.ts$': (string | {
            tsconfig: string;
        })[];
    };
    testMatch: string[];
    setupFilesAfterEnv: string[];
};
export default config;
//# sourceMappingURL=jest.config.d.ts.map