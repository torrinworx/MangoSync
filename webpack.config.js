import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { transformBabelAST } = await import("destam-dom/transform/htmlLiteral.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = process.env.ENV;

const config = {
    name: 'mango-sync',
    target: 'web',
    stats: 'minimal',
    devtool: 'source-map',
    mode: env,
    entry: {
        mango_sync: './frontend/src/index.jsx',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        publicPath: '/',
        filename: 'index.js',
    },
    resolve: {
        extensions: ['.html', '.css', '.js', '.jsx'],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.HOST_URL': JSON.stringify(process.env.HOST_URL),
        }),
        new HtmlWebpackPlugin({
            template: './frontend/public/index.html',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-syntax-jsx',
                            () => ({
                                visitor: {
                                    Program: path => {
                                        transformBabelAST(path.node);
                                    }
                                }
                            })
                        ],
                    }
                }
            },
            {
                test: /\.(png|jpg|jpeg|gif|ico|webp)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[name][ext][query]',
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ]
    },

    devServer: {
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        static: {
            directory: path.join(__dirname, 'public'),
        },
        hot: true,
        historyApiFallback: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
            logging: 'error',
        },
        proxy: {
            // Proxy requests to FastAPI server
            '/api': process.env.URL || 'http://localhost:3000'
        },
    },
};

export default config;
