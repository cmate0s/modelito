import { openDB, type DBSchema } from 'idb'
import type { Outfit } from './types.ts'

interface Schema extends DBSchema {
  outfits: { key: string; value: Outfit; indexes: { 'by-date': string } }
}

const dbPromise = openDB<Schema>('modelito', 1, {
  upgrade(db) {
    db.createObjectStore('outfits', { keyPath: 'id' }).createIndex('by-date', 'date')
  },
})

export async function listOutfits(): Promise<Outfit[]> {
  const all = await (await dbPromise).getAll('outfits')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveOutfit(outfit: Outfit): Promise<void> {
  await (await dbPromise).put('outfits', outfit)
}

export async function deleteOutfit(id: string): Promise<void> {
  await (await dbPromise).delete('outfits', id)
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export async function exportBackup(): Promise<Blob> {
  const outfits = await listOutfits()
  const items = await Promise.all(
    outfits.map(async (o) => ({ ...o, photo: await toDataUrl(o.photo) })),
  )
  return new Blob([JSON.stringify({ app: 'modelito', version: 1, items })], {
    type: 'application/json',
  })
}

export async function importBackup(file: File): Promise<number> {
  const data = JSON.parse(await file.text())
  if (data?.app !== 'modelito' || !Array.isArray(data.items)) {
    throw new Error('El archivo no es una copia de Modelito')
  }
  const db = await dbPromise
  for (const item of data.items) {
    const photo = await (await fetch(item.photo)).blob()
    await db.put('outfits', { ...item, photo })
  }
  return data.items.length
}
