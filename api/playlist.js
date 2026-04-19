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
        // 改用 injahow 稳定接口（和你播放器原来用的一样，网易云官方现在反爬拦截）
        const apiUrl = `https://api.injahow.cn/meting/?server=netease&type=playlist&id=${id}`;
        const { data } = await axios.get(apiUrl, { timeout: 10000 });

        // 全容错判断，再也不会报undefined错误
        if (!data || !Array.isArray(data)) {
            return res.status(500).json({ code: 500, msg: '歌单不存在或接口被网易云拦截' });
        }

        // 完美兼容你播放器的格式！不再限制30首！
        const result = {
            code: 200,
            playlist: {
                id: id,
                name: '自定义歌单',
                tracks: data
            }
        };

        cache.set(cacheKey, { data: result, time: Date.now() });
        return res.json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, msg: '获取失败', error: err.message });
    }
}
