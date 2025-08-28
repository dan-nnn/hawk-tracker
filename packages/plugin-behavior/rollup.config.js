import { createRollupConfig } from '@workspace/build-config/base';
import { readFileSync } from 'fs';
// import { dts } from 'rollup-plugin-dts';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default createRollupConfig(pkg, {});
