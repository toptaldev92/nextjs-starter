const webpack = require('webpack')

require('dotenv').config()

module.exports = {
  webpack: (config, { dev }) => {
    config.module.rules.push(
      {
        test: /\.(css|scss)/,
        loader: 'emit-file-loader',
        options: {
          name: 'dist/[path][name].[ext]'
        }
      },
      {
        test: /\.css$/,
        loader: 'babel-loader!raw-loader'
      },
      {
        test: /\.scss$/,
        loader: 'babel-loader!raw-loader!sass-loader'
      }
    )
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.MY_ENV_VAR': JSON.stringify(process.env.MY_ENV_VAR)
      })
    )
    return config
  }
}