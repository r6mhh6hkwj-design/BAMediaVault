import http from 'http'

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlM2RlZTg1Ni1hN2E3LTQ3YTUtYWY0MS04MDFkY2QyNDc4NzMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzgwOTIzNDA5LCJleHAiOjE3ODE1MjgyMDl9.JmVxUngFx9U7aQt1RuwDXcqhWT_yzyu0ZMKBSmxKsIk'

function request(method: string, path: string, body?: any, contentType?: string): Promise<{status: number, data: string}> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${TOKEN}`,
    }
    let rawData = ''
    if (body) {
      rawData = typeof body === 'string' ? body : JSON.stringify(body)
      headers['Content-Type'] = contentType || 'application/json'
    }
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers,
    }, (res) => {
      let d = ''
      res.on('data', (c) => { d += c })
      res.on('end', () => resolve({ status: res.statusCode || 0, data: d }))
    })
    if (rawData) req.write(rawData)
    req.end()
  })
}

async function main() {
  // 1. Get files
  const listRes = await request('GET', '/api/files')
  console.log('Files:', listRes.data.substring(0, 300))

  const files = JSON.parse(listRes.data).files
  if (files.length === 0) {
    console.log('No files to test batch download. Please upload files via the browser first.')
    return
  }

  // 2. Test batch download
  const ids = files.map((f: any) => f.id)
  console.log('Testing batch download with ids:', ids)
  const dlRes = await request('POST', '/api/files/batch-download', { ids })
  console.log('Batch download status:', dlRes.status)
  console.log('Response length:', dlRes.data.length)
  console.log('First 50 bytes:', dlRes.data.substring(0, 50))
}

main().catch(console.error)
