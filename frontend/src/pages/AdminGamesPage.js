import React, { useState, useEffect } from 'react';
import { Layout, Input, Select, Table, Tag, message, Button, Modal, Popconfirm } from 'antd';
import { Search, Trash2, Edit, RefreshCw, Database, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGames, getSignedUrl } from '../api/api';
import axios from 'axios';
import './AdminGamesPage.css';

const { Header, Content } = Layout;
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// 游戏类型映射
const CATEGORY_LABELS = {
  action: '动作冒险',
  turn_based: '回合战棋',
  wuxia: '国风仙侠',
  retro: '复古经典',
  female_lead: '女性主角',
  utility: '实用工具',
  horror: '恐怖惊悚',
  shooter: '枪战射击',
  fighting: '格斗对战',
  simulation: '模拟经营',
  puzzle: '益智休闲',
  interactive: '真人互动',
  racing: '竞速体育',
  strategy: '策略战略',
  roguelike: '肉鸽游戏',
  vr: '虚拟现实（VR）',
  visual_novel: '视觉小说',
  rpg: '角色扮演',
};

const STORAGE_TYPE_LABELS = {
  oss: 'OSS 云存储',
  netdisk: '网盘分享',
};

const NETDISK_TYPE_LABELS = {
  quark: '夸克网盘',
  xunlei: '迅雷网盘',
  baidu: '百度网盘',
  aliyun: '阿里云盘',
};

function AdminGamesPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [storageFilter, setStorageFilter] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 检查是否是 localhost
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      navigate('/chat');
      return;
    }
    loadGames();
  }, [navigate]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await getGames();
      // API 直接返回数组，不是 { games: [...] }
      const gamesData = Array.isArray(response) ? response : (response.games || []);
      
      // 为每个游戏加载封面图片签名 URL
      const gamesWithCovers = await Promise.all(
        gamesData.map(async (game) => {
          if (game.cover_image_url?.includes('oss-cn-hangzhou.aliyuncs.com')) {
            try {
              const signedUrl = await getSignedUrl(game.cover_image_url);
              return { ...game, signedCoverUrl: signedUrl };
            } catch {
              return { ...game, signedCoverUrl: game.cover_image_url };
            }
          }
          return { ...game, signedCoverUrl: game.cover_image_url };
        })
      );
      
      setGames(gamesWithCovers);
      setFilteredGames(gamesWithCovers);
    } catch (error) {
      console.error('Load games error:', error);
      message.error('加载游戏列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索和筛选
  useEffect(() => {
    let result = games;
    
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (g) =>
          g.name?.toLowerCase().includes(search) ||
          g.name_en?.toLowerCase().includes(search) ||
          g.description?.toLowerCase().includes(search)
      );
    }
    
    if (categoryFilter) {
      result = result.filter((g) => g.category === categoryFilter);
    }
    
    if (storageFilter) {
      result = result.filter((g) => g.storage_type === storageFilter);
    }
    
    setFilteredGames(result);
  }, [searchText, categoryFilter, storageFilter, games]);

  // 删除游戏
  const handleDelete = async (gameId) => {
    try {
      await axios.delete(`${API_BASE}/api/games/${gameId}`);
      message.success('删除成功');
      loadGames();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 查看详情
  const showDetail = (game) => {
    setSelectedGame(game);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '封面',
      dataIndex: 'signedCoverUrl',
      key: 'cover',
      width: 80,
      render: (url) =>
        url ? (
          <img src={url} alt="cover" className="admin-cover-thumb" />
        ) : (
          <div className="admin-cover-placeholder">无</div>
        ),
    },
    {
      title: '游戏名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name, record) => (
        <div>
          <div className="admin-game-name">{name}</div>
          {record.name_en && <div className="admin-game-name-en">{record.name_en}</div>}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) =>
        category ? (
          <Tag color="purple">{CATEGORY_LABELS[category] || category}</Tag>
        ) : (
          <Tag>未分类</Tag>
        ),
    },
    {
      title: '存储方式',
      dataIndex: 'storage_type',
      key: 'storage_type',
      width: 120,
      render: (type, record) => (
        <div>
          <Tag color={type === 'oss' ? 'blue' : 'green'}>
            {STORAGE_TYPE_LABELS[type] || type}
          </Tag>
          {type === 'netdisk' && record.netdisk_type && (
            <div className="admin-netdisk-type">
              {NETDISK_TYPE_LABELS[record.netdisk_type] || record.netdisk_type}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <div className="admin-actions">
          <Button
            type="text"
            icon={<Edit size={16} />}
            onClick={() => showDetail(record)}
          />
          <Popconfirm
            title="确定删除这个游戏吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Layout className="admin-games-page">
      <Header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <Button
              type="text"
              icon={<ArrowLeft size={20} />}
              onClick={() => navigate('/chat')}
              className="admin-back-btn"
            />
            <Database size={24} />
            <span>游戏库管理</span>
            <Tag color="red">仅限 localhost</Tag>
          </div>
          <div className="admin-stats">
            <span>共 {games.length} 个游戏</span>
            <Button
              icon={<RefreshCw size={16} />}
              onClick={loadGames}
              loading={loading}
            >
              刷新
            </Button>
          </div>
        </div>
      </Header>

      <Content className="admin-content">
        {/* 搜索和筛选 */}
        <div className="admin-filters">
          <Input
            prefix={<Search size={16} />}
            placeholder="搜索游戏名称、英文名或描述..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="admin-search"
            allowClear
          />
          <Select
            placeholder="游戏类型"
            value={categoryFilter || undefined}
            onChange={setCategoryFilter}
            allowClear
            className="admin-filter-select"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="存储方式"
            value={storageFilter || undefined}
            onChange={setStorageFilter}
            allowClear
            className="admin-filter-select"
          >
            <Select.Option value="oss">OSS 云存储</Select.Option>
            <Select.Option value="netdisk">网盘分享</Select.Option>
          </Select>
        </div>

        {/* 游戏列表 */}
        <Table
          columns={columns}
          dataSource={filteredGames}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          className="admin-table"
          scroll={{ x: 1000 }}
        />
      </Content>

      {/* 详情弹窗 */}
      <Modal
        title="游戏详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
        className="admin-detail-modal"
      >
        {selectedGame && (
          <div className="admin-detail">
            <div className="admin-detail-header">
              {selectedGame.signedCoverUrl && (
                <img
                  src={selectedGame.signedCoverUrl}
                  alt="cover"
                  className="admin-detail-cover"
                />
              )}
              <div className="admin-detail-info">
                <h2>{selectedGame.name}</h2>
                {selectedGame.name_en && <p className="en-name">{selectedGame.name_en}</p>}
                <div className="tags">
                  {selectedGame.category && (
                    <Tag color="purple">{CATEGORY_LABELS[selectedGame.category]}</Tag>
                  )}
                  <Tag color={selectedGame.storage_type === 'oss' ? 'blue' : 'green'}>
                    {STORAGE_TYPE_LABELS[selectedGame.storage_type]}
                  </Tag>
                  {selectedGame.file_size && <Tag>{selectedGame.file_size}</Tag>}
                </div>
              </div>
            </div>
            <div className="admin-detail-body">
              <div className="detail-row">
                <label>ID:</label>
                <span>{selectedGame.id}</span>
              </div>
              <div className="detail-row">
                <label>描述:</label>
                <span>{selectedGame.description || '暂无描述'}</span>
              </div>
              <div className="detail-row">
                <label>下载链接:</label>
                <a href={selectedGame.game_file_url} target="_blank" rel="noreferrer">
                  {selectedGame.game_file_url?.substring(0, 60)}...
                </a>
              </div>
              {selectedGame.storage_type === 'netdisk' && (
                <div className="detail-row">
                  <label>网盘类型:</label>
                  <span>{NETDISK_TYPE_LABELS[selectedGame.netdisk_type]}</span>
                </div>
              )}
              <div className="detail-row">
                <label>上传时间:</label>
                <span>{new Date(selectedGame.created_at).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default AdminGamesPage;
