import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ code: 400, msg: '缺少 id' });

    const cacheKey = `playlist_${id}`;
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.time < CACHE_TTL) {
            return res.json(cached.data);
        }
    }

    try {
        // 1. 获取歌单基础信息
        const { data: detailRes } = await axios.get(`https://music.163.com/api/v6/playlist/detail?id=${id}`, { timeout: 8000 });
        const detail = detailRes.data;

        // 2. 获取全部歌曲（兼容网易云新版返回结构，带容错！）
        const { data: allRes } = await axios.get(`https://music.163.com/api/v3/playlist/track/all?id=${id}`, { timeout: 8000 });
        const all = allRes.data;

        // 容错判断：新版接口 songs 在 body 里，不是data里！
        const allSongs = all?.songs || detail?.playlist?.tracks || [];

        // 合并覆盖全部歌曲（解决只加载30首问题）
        detail.playlist.tracks = allSongs;
        detail.playlist.trackCount = allSongs.length;

        cache.set(cacheKey, { data: detail, time: Date.now() });
        return res.json(detail);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, msg: '获取失败', error: err.message });
    }
}
