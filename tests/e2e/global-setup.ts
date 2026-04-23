import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import type { FullConfig } from '@playwright/test'

const storageDir = path.resolve(process.cwd(), 'storage')

function resetStorageFiles() {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true })
  }

  for (const file of ['user.json', 'vendor.json', 'admin.json']) {
    const filePath = path.join(storageDir, file)
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
  }
}

async function globalSetup(_config: FullConfig) {
  resetStorageFiles()

  if (process.env.E2E_SKIP_SEED !== 'true') {
    execSync('npm run seed:e2e', {
      stdio: 'inherit',
      env: process.env,
    })
  }
}

export default globalSetup
