import axios from 'axios';
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ code: 400, msg: '缺少 id' });

    const cacheKey = `song_pic_${id}`;
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.time < CACHE_TTL) return res.json(cached.data);
    }

    try {
        const { data } = await axios.get(`https://api.injahow.cn/meting/?server=netease&type=pic&id=${id}`, { timeout: 10000 });
        cache.set(cacheKey, { data, time: Date.now() });
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ code: 500, msg: '获取失败', error: err.message });
    }
}
