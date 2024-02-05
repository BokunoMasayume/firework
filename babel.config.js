module.exports = function(api) {
    api.cache(true);
    const presets = [
        "@babel/env",
        "@babel/preset-typescript"
    ];
    return {
        presets,
        plugins: [
            "babel-plugin-transform-class-properties",
            "@babel/plugin-transform-runtime",
        ],
        exclude: [
            "**/node_modules/**",
            "**/dist/**"
        ]
    }
}