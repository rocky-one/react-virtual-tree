const path = require('path')
module.exports = ({ config }) => {
    config.module.rules.push({
        test: /\.scss$/,
        loaders: ["style-loader", "css-loader", "sass-loader"],
        include: path.resolve(__dirname, '../src')
    });
    config.module.rules.push({
        test: /\.less$/,
        loaders: ["style-loader", "css-loader", "less-loader"],
        include: path.resolve(__dirname, '../src')
    });
    config.module.rules.push({
        test: /\.(ts|tsx)$/,
        use: [
            {
                loader: require.resolve('awesome-typescript-loader'),
            },
            {
                loader: require.resolve('react-docgen-typescript-loader'),
            },
            // {
            //     loader: require.resolve('babel-loader'),
            //     options: {
            //         presets: [
            //             '@babel/preset-env'
            //         ],
            //         plugins: [
            //             ["@babel/plugin-proposal-decorators", { "legacy": true }],
            //             ["@babel/plugin-proposal-class-properties", { "loose": true }],
            //             "@babel/plugin-transform-runtime"
            //         ]
            //     }
            // },
        ],
    });
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
};