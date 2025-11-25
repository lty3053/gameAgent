import React, { useState, useEffect } from 'react';
import { Layout, Button, Tag, Descriptions, message, Spin, Card } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getGameById } from '../api/api';
import './GameDetailPage.css';

const { Header, Content } = Layout;

function GameDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGameDetail = async () => {
      try {
        setLoading(true);
        const response = await getGameById(id);
        setGame(response.game);
      } catch (error) {
        message.error('加载游戏详情失败');
        console.error('Error loading game detail:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadGameDetail();
  }, [id]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const mb = parseInt(bytes) / 1024 / 1024;
    return mb.toFixed(2) + ' MB';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  const handleDownload = () => {
    if (game?.game_file_url) {
      window.open(game.game_file_url, '_blank');
      message.success('开始下载...');
    }
  };

  if (loading) {
    return (
      <Layout className="game-detail-page">
        <div className="loading-container">
          <Spin size="large" tip="加载中..." />
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout className="game-detail-page">
        <div className="error-container">
          <h2>游戏不存在</h2>
          <Button type="primary" onClick={() => navigate('/games')}>
            返回游戏库
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="game-detail-page">
      <Header className="detail-header">
        <div className="header-content">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/games')}
            className="back-btn"
          >
            返回游戏库
          </Button>
          <h1>游戏详情</h1>
        </div>
      </Header>

      <Content className="detail-content">
        <div className="detail-container">
          <div className="game-hero">
            <div className="hero-cover">
              {game.cover_image_url ? (
                <img src={game.cover_image_url} alt={game.name} />
              ) : (
                <div className="default-hero-cover">
                  <span className="game-icon">🎮</span>
                </div>
              )}
            </div>
            <div className="hero-info">
              <h1 className="game-name">{game.name}</h1>
              {game.name_en && <h2 className="game-name-en">{game.name_en}</h2>}
              
              <div className="game-meta">
                {game.category && <Tag color="blue">{game.category}</Tag>}
                {game.release_date && (
                  <Tag icon={<ClockCircleOutlined />}>{game.release_date}</Tag>
                )}
                {game.file_size && (
                  <Tag>{formatFileSize(game.file_size)}</Tag>
                )}
              </div>

              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                className="download-btn"
                disabled={!game.game_file_url}
              >
                立即下载
              </Button>
            </div>
          </div>

          <Card className="detail-card" title="游戏信息">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="游戏名称">
                {game.name}
              </Descriptions.Item>
              {game.name_en && (
                <Descriptions.Item label="英文名称">
                  {game.name_en}
                </Descriptions.Item>
              )}
              {game.developer && (
                <Descriptions.Item label="开发商">
                  {game.developer}
                </Descriptions.Item>
              )}
              {game.version && (
                <Descriptions.Item label="版本">
                  {game.version}
                </Descriptions.Item>
              )}
              {game.category && (
                <Descriptions.Item label="分类">
                  {game.category}
                </Descriptions.Item>
              )}
              {game.file_size && (
                <Descriptions.Item label="文件大小">
                  {formatFileSize(game.file_size)}
                </Descriptions.Item>
              )}
              {game.release_date && (
                <Descriptions.Item label="发布日期">
                  {game.release_date}
                </Descriptions.Item>
              )}
              {game.created_at && (
                <Descriptions.Item label="上传时间">
                  {formatDate(game.created_at)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {game.description && (
            <Card className="detail-card" title="游戏简介">
              <div className="game-description-full">
                {game.description}
              </div>
            </Card>
          )}

          {game.video_url && (
            <Card className="detail-card" title="游戏视频">
              <video controls className="game-video">
                <source src={game.video_url} />
                您的浏览器不支持视频播放
              </video>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default GameDetailPage;
