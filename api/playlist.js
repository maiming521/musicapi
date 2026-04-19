
import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 缓存1小时

export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ code: 400, msg: '缺少 id' });

    // 缓存
    const cacheKey = `playlist_${id}`;
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.time < CACHE_TTL) {
            return res.json(cached.data);
        }
    }

    try {
        // 1. 获取歌单信息
        const { data: detail } = await axios.get(
            `https://music.163.com/api/v6/playlist/detail?id=${id}`,
            { timeout: 8000 }
        );

        // 2. 获取【全部歌曲】（解决只返回30首）
        const { data: all } = await axios.get(
            `https://music.163.com/api/v3/playlist/track/all?id=${id}`,
            { timeout: 8000 }
        );

        // 合并
        detail.playlist.tracks = all.songs;
        detail.playlist.trackCount = all.songs.length;

        cache.set(cacheKey, { data: detail, time: Date.now() });
        return res.json(detail);
    } catch (err) {
        return res.status(500).json({ code: 500, msg: '获取失败', error: err.message });
    }
}
