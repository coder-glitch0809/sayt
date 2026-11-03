/*
  Where uploaded images go.
  - CLOUDINARY_URL set → Cloudinary, returns absolute https URLs
  - MONGODB_URI set    → MongoDB GridFS (survives Render restarts, no extra account), served at /media/<id>
  - otherwise          → server/uploads on disk, served at /uploads/…
  Images that ship with the repo (server/uploads) are always listed, so the seed photos stay pickable.
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const IMG = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const FOLDER = process.env.CLOUDINARY_FOLDER || 'portfolio';

function localFiles(dir) {
  return fs.readdirSync(dir).filter((f) => IMG.test(f))
    .map((f) => ({ url: `/uploads/${f}`, mtime: fs.statSync(path.join(dir, f)).mtimeMs }));
}

async function gridfsMedia(uploadsDir, uri) {
  const { MongoClient, GridFSBucket, ObjectId } = await import('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  const bucket = new GridFSBucket(client.db(process.env.MONGODB_DB || 'portfolio'), { bucketName: 'media' });

  return {
    kind: 'mongodb-gridfs',
    save: (file) => new Promise((resolve, reject) => {
      const up = bucket.openUploadStream(file.originalname, { metadata: { contentType: file.mimetype } });
      up.on('error', reject);
      up.on('finish', () => resolve(`/media/${up.id}`));
      up.end(file.buffer);
    }),
    async list() {
      const files = await bucket.find({}).sort({ uploadDate: -1 }).limit(500).toArray();
      const remote = files.map((f) => ({ url: `/media/${f._id}`, mtime: f.uploadDate.getTime() }));
      return [...remote, ...localFiles(uploadsDir)].sort((a, b) => b.mtime - a.mtime);
    },
    // express handler for GET /media/:id
    async serve(req, res) {
      let id;
      try { id = new ObjectId(req.params.id); } catch { return res.status(404).end(); }
      const [file] = await bucket.find({ _id: id }).limit(1).toArray();
      if (!file) return res.status(404).end();
      res.set({
        'Content-Type': file.metadata?.contentType || 'application/octet-stream',
        'Content-Length': file.length,
        // ids never get reused, so the browser may keep the image forever
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      bucket.openDownloadStream(id).on('error', () => res.destroy()).pipe(res);
    },
  };
}

export async function createMedia(uploadsDir) {
  fs.mkdirSync(uploadsDir, { recursive: true });

  if (process.env.CLOUDINARY_URL) {
    const { v2: cloudinary } = await import('cloudinary'); // reads CLOUDINARY_URL by itself
    return {
      kind: 'cloudinary',
      save: (file) => new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: FOLDER, resource_type: 'image' },
          (err, out) => (err ? reject(err) : resolve(out.secure_url)),
        );
        stream.end(file.buffer);
      }),
      async list() {
        const res = await cloudinary.api.resources({ type: 'upload', prefix: `${FOLDER}/`, max_results: 200 });
        const remote = res.resources.map((r) => ({ url: r.secure_url, mtime: Date.parse(r.created_at) }));
        return [...remote, ...localFiles(uploadsDir)].sort((a, b) => b.mtime - a.mtime);
      },
    };
  }

  if (process.env.MONGODB_URI) return gridfsMedia(uploadsDir, process.env.MONGODB_URI);

  return {
    kind: 'disk',
    async save(file) {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
      const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, name), file.buffer);
      return `/uploads/${name}`;
    },
    async list() { return localFiles(uploadsDir).sort((a, b) => b.mtime - a.mtime); },
  };
}
