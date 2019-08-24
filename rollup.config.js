import typescript from 'rollup-plugin-typescript'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
// import simplevars from 'postcss-simple-vars';
// import nested from 'postcss-nested';
// import cssnext from 'postcss-cssnext';
// import cssnano from 'cssnano';
// import postcss from 'rollup-plugin-postcss';
import multiInput from 'rollup-plugin-multi-input';
import scss from 'rollup-plugin-scss'
const fs = require('fs');
const path = require('path');
const componentDir = 'src/components';
const componentsNames = fs.readdirSync(path.resolve(componentDir));
const pathMap = componentsNames.reduce((prev, name) => {
    prev[name] = `${componentDir}/${name}/index.js`
    return prev;
}, {});

let rollupConfig = []
rollupConfig = Object.keys(pathMap).map(key => {
    return setRollupConfig(key)
})

function setRollupConfig(moduleName) {
    return {
        input: pathMap,
        output: {
            dir: 'es',
            format: 'es',
            entryFileNames: '[name]/index.js',
            exports: 'named'
        },
        external: ['react', 'react-dom'],
        plugins: [
            multiInput(),
            scss({
                output:  `es/${moduleName}/style/index.css`,
                extensions: ['.css','.scss'],
            }),
            // postcss({
            //     // modules: true, // 增加 css-module 功能
            //     extensions: ['.css', '.scss'],
            //     // 样式输出到 createModuleConfig 创建的模块文件夹下
            //     extract: `es/${moduleName}/style/index.css`,
            //     plugins: [
            //         simplevars(),
            //         nested(),
            //         cssnext({ warnForDuplicates: false, }),
            //         cssnano(),
            //       ],
            //     // use: [
            //     //     ['scss', {
            //     //         javascriptEnabled: true
            //     //     }]
            //     // ],
            // }),
            typescript(),
            resolve(),
            commonjs({
                include: 'node_modules/**',
                namedExports: {
                    'node_modules/react/index.js': ['Component', 'PureComponent', 'Fragment', 'Children', 'createElement']
                }
            })
        ]
    }
}

export default rollupConfig

