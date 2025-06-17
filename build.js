import { Bun } from 'bun'
export default await Bun.build({
    entrypoints: ['./src/command/*.ts'],
    outdir: './out',
    
    
})
// => { success: boolean, outputs: BuildArtifact[], logs: BuildMessage[] }