import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ code: 400, msg: '缺少 id' });

    const cacheKey = `song_${id}`;
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.time < CACHE_TTL) {
            return res.json(cached.data);
        }
    }

    try {
        const result = {
            code: 200,
            data: [{
                id,
                url: `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
                type: 'mp3'
            }]
        };

        cache.set(cacheKey, { data: result, time: Date.now() });
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ code: 500, msg: '获取失败' });
    }
}
