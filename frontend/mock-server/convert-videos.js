import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

ffmpeg.setFfmpegPath(ffmpegPath.path)

const VIDEOS_DIR = path.join(__dirname, 'videos')

// Convert AVI files to MP4
async function convertAviToMp4() {
  const files = fs.readdirSync(VIDEOS_DIR)

  for (const file of files) {
    if (path.extname(file).toLowerCase() === '.avi') {
      const inputPath = path.join(VIDEOS_DIR, file)
      const outputPath = path.join(VIDEOS_DIR, file.replace('.avi', '.mp4'))

      console.log(`Converting ${file} to MP4...`)

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset fast',
            '-crf 23'
          ])
          .save(outputPath)
          .on('end', () => {
            console.log(`✓ Converted ${file} to ${path.basename(outputPath)}`)
            // Delete original AVI file
            fs.unlinkSync(inputPath)
            console.log(`✓ Deleted original ${file}`)
            resolve()
          })
          .on('error', (err) => {
            console.error(`✗ Error converting ${file}:`, err.message)
            reject(err)
          })
      })
    }
  }

  console.log('All conversions complete!')
}

convertAviToMp4().catch(console.error)
