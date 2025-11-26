import type { Config } from 'postcss-load-config';
import autoprefixer from 'autoprefixer'
import pandacss from '@pandacss/dev/postcss'

const config: Config = {
  plugins: {
    pandacss, autoprefixer
  }
};

export default config;
